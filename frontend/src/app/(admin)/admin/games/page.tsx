import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getGames, type Game } from "@/lib/game-api";
import { Plus } from "lucide-react";
import GameTable from "@/components/admin/GameTable";

export default async function GamesPage() {
  let games: Game[] = [];
  let errorMessage: string | null = null;

  try {
    games = await getGames();
  } catch {
    errorMessage = "Impossible de charger les parties.";
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestion des parties
          </h1>
          <p className="text-sm text-muted-foreground">
            Consultez, créez et gérez les parties à venir.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/games/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle partie
          </Link>
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <GameTable initialGames={games} />
    </main>
  );
}
