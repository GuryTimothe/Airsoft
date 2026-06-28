"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Lock, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export function GameListCard() {
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
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Prochaines parties</h2>
      </div>
      {parties.map((party, index) => {
        const isFull = party.players >= party.maxPlayers;
        const fillPercentage = (party.players / party.maxPlayers) * 100;

        return (
          <div
            key={party.id}
            style={{
              animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                index * 0.15
              }s both`,
            }}
            className="relative h-full"
          >
            {/* Top accent line */}
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                isFull
                  ? "bg-gradient-to-r from-orange-400 via-red-400 to-orange-400"
                  : "bg-gradient-to-r from-primary via-cyan-400 to-primary"
              }`}
            />

            <Card>
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-tight">
                    {party.title}
                  </CardTitle>

                  <div className="flex gap-2">
                    {party.isPrivate && (
                      <Badge variant="secondary">
                        <Lock className="h-3 w-3" />
                        Privée
                      </Badge>
                    )}

                    {isFull && <Badge variant="destructive">Complet</Badge>}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      {party.players}/{party.maxPlayers} joueurs
                    </span>
                    <span>{Math.round(fillPercentage)}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${
                        isFull
                          ? "bg-gradient-to-r from-orange-400 to-red-400"
                          : "bg-gradient-to-r from-primary to-cyan-400"
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p>Date</p>
                      <time className="font-semibold">
                        {new Date(party.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4" />
                    <div>
                      <p>Terrain</p>
                      <p className="font-semibold">{party.location}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Zap className="h-4 w-4" />
                    <div>
                      <p>PAF</p>
                      <p className="font-semibold">{party.paf}€</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p>Attente</p>
                      <p className="font-semibold">
                        {party.waitlist > 0 ? `+${party.waitlist}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <Link href="/auth/register" className="block">
                  <Button className="w-full">
                    {isFull ? "Liste d'attente" : "S'inscrire"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
