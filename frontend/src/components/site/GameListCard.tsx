"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Euro, Lock } from "lucide-react";
import Link from "next/link";

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
  image?: string;
  // État d'inscription de l'utilisateur courant
  registrationStatus?: "registered" | "waitlisted" | null;
}

const parties: Party[] = [
  {
    id: 1,
    title: "CQB Night Session",
    date: "2026-06-12",
    location: "Terrain Nord",
    paf: 10,
    maxPlayers: 24,
    players: 24,
    waitlist: 3,
    isPrivate: false,
    image: "/images/cqb-night.jpg",
    registrationStatus: null,
  },
  {
    id: 2,
    title: "MilSim Weekend",
    date: "2026-06-20",
    location: "Forest Base Alpha",
    paf: 15,
    maxPlayers: 40,
    players: 32,
    waitlist: 0,
    isPrivate: true,
    image: "/images/milsim.jpg",
    registrationStatus: "registered",
  },
  {
    id: 3,
    title: "Training Day",
    date: "2026-06-28",
    location: "CQB Indoor",
    paf: 8,
    maxPlayers: 16,
    players: 10,
    waitlist: 1,
    isPrivate: false,
    image: "/images/training.jpg",
    registrationStatus: "waitlisted",
  },
];

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
  return (
    <section aria-labelledby="upcoming-games-title" className="space-y-4">
      <h2 id="upcoming-games-title" className="text-2xl font-semibold">
        Prochaines parties
      </h2>

      <ul className="space-y-4 list-none p-0 m-0" role="list">
        {parties.map((party) => {
          const isFull = party.players >= party.maxPlayers;
          const spotsLeft = party.maxPlayers - party.players;

          const formattedDate = new Date(party.date).toLocaleDateString(
            "fr-FR",
            { weekday: "long", day: "numeric", month: "long" },
          );

          return (
            <li key={party.id}>
              <Card className="overflow-hidden pt-0">
                {/* Banner image — flush, pas de padding */}
                <div className="relative h-40 bg-muted" aria-hidden="true">
                  {party.image ? (
                    <img
                      src={party.image}
                      alt="bannière de la partie"
                      className="w-full h-full object-cover block"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}

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
    </section>
  );
}
