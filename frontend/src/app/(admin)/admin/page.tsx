import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Euro, Lock, MapPin, Users } from "lucide-react";
import { getGamesPage, type Game } from "@/lib/game-api";
import { getUsers } from "@/lib/user-api";
import { formatWallClockDateTime } from "@/lib/date-time";

function extractPage(url?: string): number | null {
  if (!url) {
    return null;
  }

  const match = url.match(/[?&]page=(\d+)/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
}

async function getAllGames(): Promise<{ games: Game[]; totalItems?: number }> {
  const allGames: Game[] = [];
  let currentPage = 1;
  let totalItems: number | undefined;

  for (let guard = 0; guard < 100; guard += 1) {
    const result = await getGamesPage(currentPage);
    allGames.push(...result.games);
    if (result.totalItems !== undefined) {
      totalItems = result.totalItems;
    }

    const nextPage = extractPage(result.view?.next);
    if (!nextPage || nextPage <= currentPage) {
      break;
    }

    currentPage = nextPage;
  }

  return { games: allGames, totalItems };
}

async function countAllUsers(): Promise<number> {
  let total = 0;
  let currentPage = 1;

  for (let guard = 0; guard < 100; guard += 1) {
    const result = await getUsers(currentPage);
    total += result.users.length;

    const nextPage = extractPage(result.view?.next);
    if (!nextPage || nextPage <= currentPage) {
      break;
    }

    currentPage = nextPage;
  }

  return total;
}

export default async function AdminDashboard() {
  const [{ games, totalItems }, usersCount] = await Promise.all([
    getAllGames(),
    countAllUsers(),
  ]);

  const gamesCount = totalItems ?? games.length;
  // eslint-disable-next-line react-hooks/purity -- server-rendered timestamp used as one-shot cutoff for upcoming games list
  const now = Date.now();
  const upcomingGames = games
    .filter((game) => new Date(game.startDateTime).getTime() > now)
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime(),
    );

  return (
    <main className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total parties</p>
            <p className="text-2xl font-bold">{gamesCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            <p className="text-2xl font-bold">{usersCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines parties</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingGames.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              Aucune partie a venir pour le moment.
            </div>
          ) : (
            <ul className="space-y-4 list-none p-0 m-0" role="list">
              {upcomingGames.map((game) => {
                const spotsLeft = Math.max(
                  0,
                  game.maxPlaces - game.registrationCount,
                );

                const formattedDate = formatWallClockDateTime(
                  game.startDateTime,
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <li key={game.id}>
                    <Card>
                      <CardContent className="pt-4 pb-5 space-y-4">
                        <div className="flex justify-end gap-2">
                          {!game.isPublic && (
                            <Badge variant="secondary" className="gap-1">
                              <Lock className="h-3 w-3" aria-hidden="true" />
                              Privee
                            </Badge>
                          )}
                          {game.full && (
                            <Badge variant="destructive">Complet</Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold leading-snug">
                          {game.title}
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
                              <dd>{game.address}</dd>
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
                                {game.registrationCount}/{game.maxPlaces}{" "}
                                joueurs
                                {!game.full && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    ({spotsLeft} place{spotsLeft > 1 ? "s" : ""}
                                    )
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
                              <dd>{game.price} EUR</dd>
                            </div>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
