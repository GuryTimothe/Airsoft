"use client";

import { useEffect, useState } from "react";
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
import { CalendarDays, MapPin, PencilLine, Trash2, Users } from "lucide-react";

interface GameDetailProps {
  gameId: number;
}

export function GameDetail({ gameId }: GameDetailProps) {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    getGame(gameId)
      .then((data) => {
        if (active) {
          setGame(data);
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
            <CardDescription>Vue d’ensemble de la partie.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
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
                  {game.maxPlaces} place(s) maximum
                </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Joueurs associés</CardTitle>
            <CardDescription>
              La relation joueurs n’est pas encore exposée par l’entité Game du
              backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Aucun joueur lié n’est actuellement disponible via l’API. La
              capacité maximale est visible ici, et la relation pourra être
              ajoutée plus tard si vous exposez les participants dans le
              backend.
            </div>
          </CardContent>
        </Card>
      </div>

      {game.description ? (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
            {game.description}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
