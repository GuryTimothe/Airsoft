"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import {
  createGame,
  deleteGame,
  getGame,
  GameValidationError,
  updateGame,
  type Game,
  type GameFormValues,
  type GamePayload,
} from "@/lib/game-api";
import { getAppSettings } from "@/lib/settings-api";

interface GameFormProps {
  gameId?: number;
  initialGame?: Game;
}

const emptyValues: GameFormValues = {
  title: "",
  description: "",
  startDateTime: "",
  address: "",
  price: "",
  maxPlaces: "",
  isPublic: true,
};

function toFormValues(game?: Game): GameFormValues {
  if (!game) {
    return emptyValues;
  }

  return {
    title: game.title ?? "",
    description: game.description ?? "",
    startDateTime: game.startDateTime ? game.startDateTime.slice(0, 16) : "",
    address: game.address ?? "",
    price: String(game.price ?? 0),
    maxPlaces: String(game.maxPlaces ?? 0),
    isPublic: game.isPublic ?? true,
  };
}

export function GameForm({ gameId, initialGame }: GameFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GameFormValues>(
    initialGame ? toFormValues(initialGame) : emptyValues,
  );
  const [loading, setLoading] = useState(Boolean(gameId) && !initialGame);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const pageTitle = useMemo(
    () => (gameId ? "Modifier la partie" : "Créer une partie"),
    [gameId],
  );

  useEffect(() => {
    if (!gameId || initialGame) {
      return;
    }

    let active = true;
    getGame(gameId)
      .then((game) => {
        if (active) {
          setValues(toFormValues(game));
        }
      })
      .catch((err) => {
        if (active) {
          setErrors([
            err instanceof Error ? err.message : "Une erreur est survenue",
          ]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [gameId, initialGame]);

  useEffect(() => {
    if (gameId) {
      return;
    }

    let active = true;

    getAppSettings()
      .then((settings) => {
        if (!active || !settings) {
          return;
        }

        setValues((current) => ({
          ...current,
          address: current.address || settings.defaultAddress,
          price: current.price || String(settings.defaultPrice),
          maxPlaces: current.maxPlaces || String(settings.defaultMaxPlaces),
        }));
      })
      .catch(() => {
        // Keep local defaults if settings cannot be loaded.
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const clientErrors: string[] = [];

    if (!values.title.trim()) {
      clientErrors.push("Titre : ce champ ne doit pas etre vide.");
    }

    if (!values.address.trim()) {
      clientErrors.push("Adresse : ce champ ne doit pas etre vide.");
    }

    if (!values.startDateTime.trim()) {
      clientErrors.push("Date et heure : ce champ ne doit pas etre vide.");
    } else if (Number.isNaN(new Date(values.startDateTime).getTime())) {
      clientErrors.push("Date et heure : cette date n'est pas valide.");
    }

    if (!values.price.trim()) {
      clientErrors.push("PAF : ce champ ne doit pas etre vide.");
    } else if (Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
      clientErrors.push("PAF : cette valeur doit etre un nombre positif.");
    }

    if (!values.maxPlaces.trim()) {
      clientErrors.push("Places max : ce champ ne doit pas etre vide.");
    } else if (
      Number.isNaN(Number(values.maxPlaces)) ||
      Number(values.maxPlaces) < 1
    ) {
      clientErrors.push(
        "Places max : cette valeur doit etre un nombre superieur ou egal a 1.",
      );
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload: GamePayload = {
        title: values.title,
        description: values.description,
        startDateTime: values.startDateTime,
        address: values.address,
        price: Number(values.price),
        maxPlaces: Number(values.maxPlaces),
        isPublic: values.isPublic,
      };

      const savedGame = gameId
        ? await updateGame(gameId, payload)
        : await createGame(payload);

      if (gameId) {
        // After update, go to detail
        router.push(`/admin/games/${savedGame.id}`);
      } else {
        // After creation, go back to the list and force a server refresh
        router.push(`/admin/games`);
      }

      // Ensure server-side data is re-fetched
      router.refresh();
    } catch (err) {
      if (err instanceof GameValidationError) {
        setErrors(err.messages);
      } else {
        setErrors([
          err instanceof Error ? err.message : "Une erreur est survenue",
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!gameId) {
      return;
    }

    setErrors([]);
    setDeleting(true);

    try {
      await deleteGame(gameId);
      setDeleteDialogOpen(false);
      router.push("/admin/games");
      router.refresh();
    } catch (err) {
      setErrors([
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la partie",
      ]);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>
          Renseignez les informations principales de la partie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {errors.length > 0 ? (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <p className="font-semibold">
                  Veuillez corriger les erreurs suivantes :
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errors.map((errorMessage, index) => (
                    <li key={index}>{errorMessage}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="title">Titre</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(event) =>
                    setValues({ ...values, title: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="address">Adresse</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="address"
                  value={values.address}
                  onChange={(event) =>
                    setValues({ ...values, address: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                value={values.description}
                onChange={(event) =>
                  setValues({ ...values, description: event.target.value })
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="startDateTime">Date et heure</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  value={values.startDateTime}
                  onChange={(event) =>
                    setValues({ ...values, startDateTime: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="price">PAF</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.price}
                  onChange={(event) =>
                    setValues({ ...values, price: event.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="maxPlaces">Places max</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="maxPlaces"
                  type="number"
                  min="1"
                  value={values.maxPlaces}
                  onChange={(event) =>
                    setValues({ ...values, maxPlaces: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="isPrivate"
                checked={!values.isPublic}
                onCheckedChange={(checked) =>
                  setValues({ ...values, isPublic: !Boolean(checked) })
                }
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                Partie privée
              </Label>
            </div>

            <p className="text-xs text-muted-foreground">* Champ obligatoire</p>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Enregistrement…"
                  : gameId
                    ? "Enregistrer"
                    : "Créer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>

              {gameId ? (
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                      <DialogDescription>
                        Cette action supprimera definitivement la partie et ses
                        donnees associees.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Suppression..." : "Supprimer"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
