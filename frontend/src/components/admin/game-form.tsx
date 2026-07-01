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
  createGame,
  getGame,
  updateGame,
  type Game,
  type GameFormValues,
} from "@/lib/games";

interface GameFormProps {
  gameId?: number;
}

const emptyValues: GameFormValues = {
  title: "",
  description: "",
  startDateTime: "",
  address: "",
  price: "",
  maxPlaces: "",
  image: "",
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
    image: game.image ?? "",
    isPublic: game.isPublic ?? true,
  };
}

export function GameForm({ gameId }: GameFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GameFormValues>(emptyValues);
  const [loading, setLoading] = useState(Boolean(gameId));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pageTitle = useMemo(
    () => (gameId ? "Modifier la partie" : "Créer une partie"),
    [gameId],
  );

  useEffect(() => {
    if (!gameId) {
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
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
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
  }, [gameId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        price: Number(values.price),
        maxPlaces: Number(values.maxPlaces),
      };

      const savedGame = gameId
        ? await updateGame(gameId, payload)
        : await createGame(payload);

      router.push(`/admin/games/${savedGame.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(event) =>
                    setValues({ ...values, title: event.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={values.address}
                  onChange={(event) =>
                    setValues({ ...values, address: event.target.value })
                  }
                  required
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
                <Label htmlFor="startDateTime">Date et heure</Label>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  value={values.startDateTime}
                  onChange={(event) =>
                    setValues({ ...values, startDateTime: event.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">PAF</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={values.price}
                  onChange={(event) =>
                    setValues({ ...values, price: event.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPlaces">Places max</Label>
                <Input
                  id="maxPlaces"
                  type="number"
                  min="1"
                  value={values.maxPlaces}
                  onChange={(event) =>
                    setValues({ ...values, maxPlaces: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                value={values.image}
                onChange={(event) =>
                  setValues({ ...values, image: event.target.value })
                }
                placeholder="/images/party.jpg"
              />
            </div>

            <div className="flex items-center gap-2 rounded-md border p-3">
              <Checkbox
                id="isPublic"
                checked={values.isPublic}
                onCheckedChange={(checked) =>
                  setValues({ ...values, isPublic: Boolean(checked) })
                }
              />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Partie publique
              </Label>
            </div>

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
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
