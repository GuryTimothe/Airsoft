"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Eye, Users } from "lucide-react";
import { type Game } from "@/lib/game-api";

type VisibilityFilter = "all" | "public" | "private";
type SortOption = "date" | "people" | "paf";

type GameTableProps = {
  initialGames: Game[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function GameTable({ initialGames }: GameTableProps) {
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredGames = useMemo(() => {
    const selectedDate = dateFilter ? new Date(dateFilter) : null;

    const filtered = initialGames.filter((game) => {
      if (visibility === "public" && !game.isPublic) {
        return false;
      }
      if (visibility === "private" && game.isPublic) {
        return false;
      }

      if (selectedDate) {
        const gameDate = new Date(game.startDateTime);
        if (gameDate < selectedDate) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      let result = 0;

      if (sortBy === "date") {
        result =
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime();
      } else if (sortBy === "people") {
        result = a.maxPlaces - b.maxPlaces;
      } else if (sortBy === "paf") {
        result = a.price - b.price;
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [initialGames, visibility, dateFilter, sortBy, sortDirection]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des parties</CardTitle>
        <CardDescription>
          Tri et filtres actifs : public/privé, date et ordre.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
            <label className="space-y-2 text-sm">
              <span>Filtrer par visibilité</span>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as VisibilityFilter)
                }
              >
                <option value="all">Tous</option>
                <option value="public">Publiques</option>
                <option value="private">Privées</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span>Date minimale</span>
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span>Trier par</span>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
              >
                <option value="date">Date</option>
                <option value="people">Nombre de places</option>
                <option value="paf">PAF</option>
              </select>
            </label>

            <label className="space-y-2 text-sm">
              <span>Ordre</span>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={sortDirection}
                onChange={(event) =>
                  setSortDirection(event.target.value as "asc" | "desc")
                }
              >
                <option value="asc">Ascendant</option>
                <option value="desc">Descendant</option>
              </select>
            </label>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setVisibility("all");
                setDateFilter("");
                setSortBy("date");
                setSortDirection("asc");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </div>

        {filteredGames.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
            Aucune partie ne correspond aux filtres.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Lieu</TableHead>
                <TableHead>Places</TableHead>
                <TableHead>PAF</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.title}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {formatDate(game.startDateTime)}
                    </div>
                  </TableCell>
                  <TableCell>{game.address}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {game.maxPlaces}
                    </div>
                  </TableCell>
                  <TableCell>{game.price.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant={game.isPublic ? "default" : "outline"}>
                      {game.isPublic ? "Publique" : "Privée"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/games/${game.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
