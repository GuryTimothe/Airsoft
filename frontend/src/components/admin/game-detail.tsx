"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { getUsers, type User } from "@/lib/user-api";
import { GameRegistrationsExportButton } from "@/components/admin/GameRegistrationsExportButton";
import { CalendarDays, MapPin, PencilLine, Trash2, Users } from "lucide-react";

interface GameDetailProps {
  gameId: number;
}

type PresenceFilter = "all" | "present" | "absent";

function computeAge(dateOfBirth: string, referenceDateIso: string): number {
  const birthDate = new Date(dateOfBirth);
  const now = new Date(referenceDateIso);

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const dayDiff = now.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
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
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>("all");
  const [referenceDateIso] = useState<string>(() => new Date().toISOString());

  const fetchGameAndRegistrations = useCallback(async (): Promise<{
    game: Game;
    registrations: GameRegistration[];
  }> => {
    const gameData = await getGame(gameId);
    let registrationData: GameRegistration[] = [];
    let usersData: User[] = [];

    try {
      [registrationData, usersData] = await Promise.all([
        getGameRegistrationsByGameId(gameId),
        getUsers(),
      ]);
    } catch (registrationError) {
      setRegistrationsError(
        registrationError instanceof Error
          ? registrationError.message
          : "Impossible de charger la liste des inscrits.",
      );
      registrationData = [];
      usersData = [];
    }

    const userAgeById = new Map<number, number>();
    usersData.forEach((user) => {
      userAgeById.set(user.id, computeAge(user.dateOfBirth, referenceDateIso));
    });

    const registrationsWithAge = registrationData.map((registration) => ({
      ...registration,
      userAge:
        registration.userAge ?? userAgeById.get(registration.userId) ?? null,
    }));

    return { game: gameData, registrations: registrationsWithAge };
  }, [gameId, referenceDateIso]);

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
    const previousRegistrations = registrations;

    setUpdatingPresenceId(registrationId);
    setRegistrations((current) =>
      current.map((registration) =>
        registration.id === registrationId
          ? { ...registration, isPresent }
          : registration,
      ),
    );

    try {
      const updated = await updateGameRegistrationPresence(
        registrationId,
        isPresent,
      );

      setRegistrations((current) =>
        current.map((registration) =>
          registration.id === registrationId
            ? {
                ...registration,
                isPresent: updated.isPresent,
              }
            : registration,
        ),
      );
    } catch (err) {
      setRegistrations(previousRegistrations);
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

  const registrationSummary = useMemo(() => {
    const presentCount = registrations.filter(
      (registration) => registration.isPresent,
    ).length;
    const absentCount = registrations.length - presentCount;

    return {
      presentCount,
      absentCount,
      totalCount: registrations.length,
    };
  }, [registrations]);

  const visibleRegistrations = useMemo(() => {
    const filtered = registrations.filter((registration) => {
      if (presenceFilter === "present") {
        return registration.isPresent;
      }

      if (presenceFilter === "absent") {
        return !registration.isPresent;
      }

      return true;
    });

    return [...filtered].sort((left, right) => {
      if (left.isPresent !== right.isPresent) {
        return left.isPresent ? -1 : 1;
      }

      const leftLastname = left.userLastname ?? "";
      const rightLastname = right.userLastname ?? "";
      const lastNameComparison = leftLastname.localeCompare(
        rightLastname,
        "fr",
      );

      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      return (left.userFirstname ?? "").localeCompare(
        right.userFirstname ?? "",
        "fr",
      );
    });
  }, [presenceFilter, registrations]);

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
          <GameRegistrationsExportButton gameId={game.id} />

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

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Presents
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {registrationSummary.presentCount}
              </p>
            </div>
            <div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-900">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Absents
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {registrationSummary.absentCount}
              </p>
            </div>
            <div className="rounded-lg border bg-background px-4 py-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total inscrits
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {registrationSummary.totalCount}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={presenceFilter === "all" ? "default" : "outline"}
              onClick={() => setPresenceFilter("all")}
            >
              Tous
            </Button>
            <Button
              type="button"
              size="sm"
              variant={presenceFilter === "present" ? "default" : "outline"}
              onClick={() => setPresenceFilter("present")}
            >
              Presents uniquement
            </Button>
            <Button
              type="button"
              size="sm"
              variant={presenceFilter === "absent" ? "default" : "outline"}
              onClick={() => setPresenceFilter("absent")}
            >
              Absents uniquement
            </Button>
          </div>

          {registrations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Aucun joueur n’est inscrit à cette partie.
            </div>
          ) : visibleRegistrations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Aucun joueur ne correspond au filtre de presence.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Nom</th>
                    <th className="px-3 py-2 font-medium">Prenom</th>
                    <th className="px-3 py-2 font-medium">Adresse mail</th>
                    <th className="px-3 py-2 font-medium">Age</th>
                    <th className="px-3 py-2 font-medium">Present</th>
                    <th className="px-3 py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRegistrations.map((registration) => {
                    const age = registration.userAge;
                    const isMinor = age !== null && age < 18;

                    return (
                      <tr
                        key={registration.id}
                        className={
                          registration.isPresent
                            ? "border-b bg-emerald-50/60"
                            : "border-b"
                        }
                      >
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
                          {age === null ? (
                            "-"
                          ) : (
                            <Badge variant={isMinor ? "destructive" : "ghost"}>
                              {age} ans
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={registration.isPresent}
                              disabled={updatingPresenceId === registration.id}
                              onCheckedChange={(checked) => {
                                if (typeof checked !== "boolean") {
                                  return;
                                }

                                void handleTogglePresence(
                                  registration.id,
                                  checked,
                                );
                              }}
                            />
                            <Badge
                              variant={
                                registration.isPresent ? "default" : "outline"
                              }
                            >
                              {registration.isPresent ? "Present" : "Absent"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              cancelingRegistrationId === registration.id
                            }
                            onClick={() => handleForceCancel(registration.id)}
                          >
                            {cancelingRegistrationId === registration.id
                              ? "Annulation..."
                              : "Retirer"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
