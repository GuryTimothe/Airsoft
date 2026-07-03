"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Euro, Lock, Users } from "lucide-react";
import Link from "next/link";
import { getGames, type Game } from "@/lib/game-api";
import gameBanner from "@/assets/images/game-banner.jpg";

interface Party {
  id: number;
  title: string;
  date: string;
  location: string;
  paf: number;
  maxPlayers: number;
  players: number;
  waitlist: number;
  isPrivate: boolean;
  // État d'inscription de l'utilisateur courant
  registrationStatus?: "registered" | "waitlisted" | null;
}

function mapGameToParty(game: Game): Party {
  return {
    id: game.id,
    title: game.title,
    date: game.startDateTime,
    location: game.address,
    paf: game.price,
    maxPlayers: game.maxPlaces,
    players: 0,
    waitlist: 0,
    isPrivate: !game.isPublic,
    registrationStatus: null,
  };
}

function RegistrationButton({ party }: { party: Party }) {
  const { registrationStatus, title } = party;

  if (registrationStatus === "registered") {
    return (
      <Button
        variant="outline"
        className="w-full"
        aria-label={`Annuler l'inscription à ${title}`}
      >
        Annuler l'inscription
      </Button>
    );
  }

  if (registrationStatus === "waitlisted") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Vous êtes en liste d'attente
        </p>
        <Button
          variant="outline"
          className="w-full"
          aria-label={`Quitter la liste d'attente pour ${title}`}
        >
          Quitter la liste d'attente
        </Button>
      </div>
    );
  }

  // Non inscrit ou non connecté
  return (
    <Link href="/auth/register" className="block">
      <Button className="w-full" aria-label={`S'inscrire à ${title}`}>
        S'inscrire
      </Button>
    </Link>
  );
}

export function GameListCard() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getGames()
      .then((fetchedGames) => {
        if (!active) return;
        setGames(fetchedGames);
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
  }, []);

  const upcomingGames = useMemo(() => {
    // Calling Date.now() is intentionally done once inside the memo.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();

    return games
      .filter(
        (game) => game.isPublic && new Date(game.startDateTime).getTime() > now,
      )
      .sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      )
      .slice(0, 3)
      .map(mapGameToParty);
  }, [games]);

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
            const isFull = party.players >= party.maxPlayers;
            const spotsLeft = party.maxPlayers - party.players;

            const formattedDate = new Date(party.date).toLocaleString("fr-FR", {
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
                      {isFull && <Badge variant="destructive">Complet</Badge>}
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
                            {!isFull && (
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

                    <RegistrationButton party={party} />
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
