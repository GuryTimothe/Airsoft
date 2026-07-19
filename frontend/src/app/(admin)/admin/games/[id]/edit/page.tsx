import { GameForm } from "@/components/admin/game-form";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GameEditPage({ params }: PageProps) {
  const { id } = await params;

  const gameId = Number(id);

  if (!Number.isFinite(gameId) || gameId <= 0) {
    redirect("/admin/games");
  }

  return <GameForm gameId={gameId} />;
}
