"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Euro, Lock, Users } from "lucide-react";
import Link from "next/link";
import { AUTH_STATE_CHANGE_EVENT } from "@/lib/auth";
import { getGames, type Game } from "@/lib/game-api";
import { getCurrentUser } from "@/lib/user-api";
import {
  cancelGameRegistration,
  getMyGameRegistrations,
  registerToGame,
  type GameRegistration,
} from "@/lib/game-registration-api";
import gameBanner from "@/assets/images/game-banner.jpg";
import { formatWallClockDateTime } from "@/lib/date-time";

interface Party {
  id: number;
  title: string;
  date: string;
  location: string;
  paf: number;
  maxPlayers: number;
  players: number;
  isPrivate: boolean;
  registrationId: number | null;
  isFull: boolean;
}

function mapGameToParty(game: Game, registrationId: number | null): Party {
  return {
    id: game.id,
    title: game.title,
    date: game.startDateTime,
    location: game.address,
    paf: game.price,
    maxPlayers: game.maxPlaces,
    players: game.registrationCount,
    isPrivate: !game.isPublic,
    registrationId,
    isFull: game.full,
  };
}

type RegistrationButtonProps = {
  party: Party;
  isAuthenticated: boolean;
  canBypassFullCapacity: boolean;
  isSubmitting: boolean;
  onRegister: (gameId: number) => Promise<void>;
  onCancel: (registrationId: number) => Promise<void>;
};

function RegistrationButton({
  party,
  isAuthenticated,
  canBypassFullCapacity,
  isSubmitting,
  onRegister,
  onCancel,
}: RegistrationButtonProps) {
  const { registrationId, title, isFull, id } = party;

  if (registrationId !== null) {
    return (
      <Button
        variant="outline"
        className="w-full"
        aria-label={`Annuler l'inscription à ${title}`}
        disabled={isSubmitting}
        onClick={() => onCancel(registrationId)}
      >
        Annuler l'inscription
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login" className="block">
        <Button
          className="w-full"
          aria-label={`Se connecter pour s'inscrire à ${title}`}
        >
          Se connecter pour s'inscrire
        </Button>
      </Link>
    );
  }

  if (isFull && !canBypassFullCapacity) {
    return (
      <Button className="w-full" disabled aria-label={`${title} est complet`}>
        Complet
      </Button>
    );
  }

  return (
    <Button
      className="w-full"
      aria-label={`S'inscrire à ${title}`}
      disabled={isSubmitting}
      onClick={() => onRegister(id)}
    >
      {isSubmitting
        ? "Inscription..."
        : isFull && canBypassFullCapacity
          ? "S'inscrire malgré complet"
          : "S'inscrire"}
    </Button>
  );
}

export function GameListCard() {
  const [games, setGames] = useState<Game[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<GameRegistration[]>(
    [],
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [referenceDateIso] = useState<string>(() => new Date().toISOString());
  const [canBypassFullCapacity, setCanBypassFullCapacity] = useState(false);

  const fetchData = useCallback(async (): Promise<{
    hasToken: boolean;
    hasAdminAccess: boolean;
    games: Game[];
    registrations: GameRegistration[];
  }> => {
    let hasToken = false;
    let hasAdminAccess = false;

    const fetchedGames = await getGames();

    try {
      const currentUser = await getCurrentUser();
      hasToken = true;
      hasAdminAccess =
        currentUser.role === "ROLE_ADMIN" ||
        currentUser.role === "ROLE_SUPER_ADMIN" ||
        currentUser.role === "ROLE_ORGANIZER";
    } catch {
      hasToken = false;
      hasAdminAccess = false;
    }

    if (hasToken) {
      let registrations: GameRegistration[] = [];

      try {
        registrations = await getMyGameRegistrations();
      } catch {
        registrations = [];
      }

      return {
        hasToken,
        games: fetchedGames,
        registrations,
        hasAdminAccess,
      };
    }

    return {
      hasToken,
      games: fetchedGames,
      registrations: [],
      hasAdminAccess,
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchData()
      .then((data) => {
        if (!active) return;

        setIsAuthenticated(data.hasToken);
        setCanBypassFullCapacity(data.hasAdminAccess);
        setGames(data.games);
        setMyRegistrations(data.registrations);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les parties.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchData]);

  useEffect(() => {
    async function handleAuthStateChange(): Promise<void> {
      let hasToken = false;
      let hasAdminAccess = false;

      try {
        const currentUser = await getCurrentUser();
        hasToken = true;
        hasAdminAccess =
          currentUser.role === "ROLE_ADMIN" ||
          currentUser.role === "ROLE_SUPER_ADMIN" ||
          currentUser.role === "ROLE_ORGANIZER";
      } catch {
        hasToken = false;
        hasAdminAccess = false;
      }

      setIsAuthenticated(hasToken);
      setCanBypassFullCapacity(hasAdminAccess);

      if (!hasToken) {
        setMyRegistrations([]);
        return;
      }

      try {
        const registrations = await getMyGameRegistrations();
        setMyRegistrations(registrations);
      } catch {
        setMyRegistrations([]);
      }
    }

    window.addEventListener(AUTH_STATE_CHANGE_EVENT, handleAuthStateChange);

    return () => {
      window.removeEventListener(
        AUTH_STATE_CHANGE_EVENT,
        handleAuthStateChange,
      );
    };
  }, []);

  async function handleRegister(gameId: number): Promise<void> {
    setSubmittingId(gameId);
    setError(null);

    try {
      const registration = await registerToGame(gameId);
      const refreshedGames = await getGames();

      setGames(refreshedGames);
      setMyRegistrations((current) => {
        const withoutSameGame = current.filter(
          (item) => item.gameId !== gameId,
        );

        return [...withoutSameGame, registration];
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de finaliser l'inscription.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleCancel(registrationId: number): Promise<void> {
    setSubmittingId(registrationId);
    setError(null);

    try {
      await cancelGameRegistration(registrationId);
      const refreshedGames = await getGames();

      setGames(refreshedGames);
      setMyRegistrations((current) =>
        current.filter((item) => item.id !== registrationId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'annuler l'inscription.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  const registrationsByGameId = useMemo(() => {
    const map = new Map<number, number>();

    myRegistrations.forEach((registration) => {
      map.set(registration.gameId, registration.id);
    });

    return map;
  }, [myRegistrations]);

  const upcomingGames = useMemo(() => {
    const referenceTime = new Date(referenceDateIso).getTime();

    return games
      .filter(
        (game) =>
          game.isPublic &&
          new Date(game.startDateTime).getTime() > referenceTime,
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      )
      .map((game) =>
        mapGameToParty(game, registrationsByGameId.get(game.id) ?? null),
      );
  }, [games, referenceDateIso, registrationsByGameId]);

  return (
    <section aria-labelledby="upcoming-games-title" className="space-y-4">
      <h2 id="upcoming-games-title" className="text-2xl font-semibold">
        Prochaines parties
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement des parties…</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : upcomingGames.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Aucune partie publique à venir pour le moment.
        </div>
      ) : (
        <ul className="space-y-4 list-none p-0 m-0" role="list">
          {upcomingGames.map((party) => {
            const spotsLeft = Math.max(0, party.maxPlayers - party.players);

            const formattedDate = formatWallClockDateTime(party.date, {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <li key={party.id}>
                <Card className="overflow-hidden pt-0">
                  <div className="relative h-40 bg-muted" aria-hidden="true">
                    <div
                      data-testid="game-banner"
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${gameBanner.src})` }}
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    <div className="absolute top-3 right-3 flex gap-2">
                      {party.isPrivate && (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" aria-hidden="true" />
                          Privée
                        </Badge>
                      )}
                      {party.isFull && (
                        <Badge variant="destructive">Complet</Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="pt-4 pb-5 space-y-4">
                    <h3 className="text-lg font-semibold leading-snug">
                      {party.title}
                    </h3>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar
                          className="h-4 w-4 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="sr-only">Date</dt>
                          <dd className="capitalize">{formattedDate}</dd>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin
                          className="h-4 w-4 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="sr-only">Terrain</dt>
                          <dd>{party.location}</dd>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users
                          className="h-4 w-4 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="sr-only">Joueurs</dt>
                          <dd>
                            {party.players}/{party.maxPlayers} joueurs
                            {!party.isFull && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({spotsLeft} place{spotsLeft > 1 ? "s" : ""})
                              </span>
                            )}
                          </dd>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Euro
                          className="h-4 w-4 text-muted-foreground shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="sr-only">PAF</dt>
                          <dd>{party.paf} €</dd>
                        </div>
                      </div>
                    </dl>

                    <RegistrationButton
                      party={party}
                      isAuthenticated={isAuthenticated}
                      canBypassFullCapacity={canBypassFullCapacity}
                      isSubmitting={
                        submittingId === party.id ||
                        (party.registrationId !== null &&
                          submittingId === party.registrationId)
                      }
                      onRegister={handleRegister}
                      onCancel={handleCancel}
                    />
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
