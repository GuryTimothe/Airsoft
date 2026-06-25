"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function GameListCard() {
  const isFull = party.players >= party.maxPlayers;
  const fillPercentage = (party.players / party.maxPlayers) * 100;

  return (
    <div
      style={{
        animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${
          index * 0.15
        }s both`,
      }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden border-border bg-card text-card-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
        {/* Top accent line */}
        <div
          className={`absolute inset-x-0 top-0 h-1 transition-all duration-300 ${
            isFull
              ? "bg-gradient-to-r from-orange-400 via-red-400 to-orange-400"
              : "bg-gradient-to-r from-primary via-cyan-400 to-primary"
          }`}
        />

        <CardHeader className="relative space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex-1 text-lg leading-tight text-foreground">
              {party.title}
            </CardTitle>

            <div className="flex shrink-0 gap-2">
              {party.isPrivate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Privée</span>
                </Badge>
              )}

              {isFull && <Badge variant="destructive">Complet</Badge>}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {party.players}/{party.maxPlayers} joueurs
              </span>

              <span
                className={`font-semibold ${
                  isFull ? "text-destructive" : "text-primary"
                }`}
              >
                {Math.round(fillPercentage)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull
                    ? "bg-gradient-to-r from-orange-400 to-red-400"
                    : "bg-gradient-to-r from-primary to-cyan-400"
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4 text-sm">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Date
                </p>

                <time className="text-sm font-semibold text-foreground">
                  {new Date(party.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Terrain
                </p>

                <p className="truncate font-semibold text-foreground">
                  {party.location}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  PAF
                </p>

                <p className="font-semibold text-foreground">{party.paf}€</p>
              </div>
            </div>

            {/* Waitlist */}
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Attente
                </p>

                <p
                  className={`font-semibold ${
                    party.waitlist > 0
                      ? "text-purple-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {party.waitlist > 0 ? `+${party.waitlist}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-2" />

          {/* Action */}
          <Link href="/auth/register" className="w-full">
            <Button
              className="group/btn w-full"
              variant={isFull ? "secondary" : "default"}
            >
              <span className="flex items-center gap-2">
                {isFull ? "Liste d'attente" : "S'inscrire"}

                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
