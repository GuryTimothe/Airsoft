"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteGame, getGame, type Game } from "@/lib/game-api";
import {
  cancelGameRegistration,
  getGameRegistrationsByGameId,
  updateGameRegistrationPresence,
  type GameRegistration,
} from "@/lib/game-registration-api";
import { CalendarDays, MapPin, PencilLine, Trash2, Users } from "lucide-react";

interface GameDetailProps {
  gameId: number;
}

export function GameDetail({ gameId }: GameDetailProps) {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationsError, setRegistrationsError] = useState<string | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [registrations, setRegistrations] = useState<GameRegistration[]>([]);
  const [cancelingRegistrationId, setCancelingRegistrationId] = useState<
    number | null
  >(null);
  const [updatingPresenceId, setUpdatingPresenceId] = useState<number | null>(
    null,
  );

  const fetchGameAndRegistrations = useCallback(async (): Promise<{
    game: Game;
    registrations: GameRegistration[];
  }> => {
    const gameData = await getGame(gameId);
    let registrationData: GameRegistration[] = [];

    try {
      registrationData = await getGameRegistrationsByGameId(gameId);
    } catch (registrationError) {
      setRegistrationsError(
        registrationError instanceof Error
          ? registrationError.message
          : "Impossible de charger la liste des inscrits.",
      );
      registrationData = [];
    }

    return { game: gameData, registrations: registrationData };
  }, [gameId]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const data = await fetchGameAndRegistrations();

        if (!active) {
          return;
        }

        setGame(data.game);
        setRegistrations(data.registrations);
        setRegistrationsError(null);
        setError(null);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [fetchGameAndRegistrations]);

  async function handleForceCancel(registrationId: number): Promise<void> {
    setCancelingRegistrationId(registrationId);

    try {
      await cancelGameRegistration(registrationId);
      const data = await fetchGameAndRegistrations();
      setGame(data.game);
      setRegistrations(data.registrations);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler cette inscription.",
      );
    } finally {
      setCancelingRegistrationId(null);
    }
  }

  async function handleTogglePresence(
    registrationId: number,
    isPresent: boolean,
  ): Promise<void> {
    setUpdatingPresenceId(registrationId);

    try {
      const updated = await updateGameRegistrationPresence(
        registrationId,
        isPresent,
      );
      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === registrationId ? updated : registration,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre a jour la presence.",
      );
    } finally {
      setUpdatingPresenceId(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteGame(gameId);
      router.push("/admin/games");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer la partie",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Chargement de la partie…</p>
    );
  }

  if (error || !game) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partie introuvable</CardTitle>
          <CardDescription>
            {error ?? "La partie demandée est introuvable."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {game.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Détails de la partie et informations principales.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/games/${game.id}/edit`}>
              <PencilLine className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Cette action supprimera définitivement la partie et ses
                  données associées.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => undefined}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Suppression…" : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
          <CardDescription>Vue d’ensemble de la partie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Date et heure</p>
                <p className="text-muted-foreground">
                  {new Date(game.startDateTime).toLocaleString("fr-FR", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Adresse</p>
                <p className="text-muted-foreground">{game.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Capacité</p>
                <p className="text-muted-foreground">
                  {game.registrationCount}/{game.maxPlaces} place(s)
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="font-medium">PAF</p>
            <p className="text-muted-foreground">{game.price.toFixed(2)} €</p>
          </div>

          <div>
            <p className="font-medium">Visibilité</p>
            <p className="text-muted-foreground">
              {game.isPublic ? "Partie publique" : "Partie privée"}
            </p>
          </div>

          <div>
            <p className="font-medium">Description</p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {game.description || "Aucune description"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Joueurs inscrits</CardTitle>
          <CardDescription>
            Suivi de presence et gestion des inscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationsError ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              {registrationsError}
            </div>
          ) : null}

          {registrations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Aucun joueur n’est inscrit à cette partie.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Nom</th>
                    <th className="px-3 py-2 font-medium">Prenom</th>
                    <th className="px-3 py-2 font-medium">Adresse mail</th>
                    <th className="px-3 py-2 font-medium">Present</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b">
                      <td className="px-3 py-2">
                        {registration.userLastname || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {registration.userFirstname || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {registration.userEmail || "-"}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={registration.isPresent}
                          disabled={updatingPresenceId === registration.id}
                          onChange={(event) =>
                            handleTogglePresence(
                              registration.id,
                              event.target.checked,
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancelingRegistrationId === registration.id}
                          onClick={() => handleForceCancel(registration.id)}
                        >
                          {cancelingRegistrationId === registration.id
                            ? "Annulation..."
                            : "Retirer"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
