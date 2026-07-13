import { notFound } from "next/navigation";
import { GameForm } from "@/components/admin/game-form";

interface PageProps {
  params: Promise<{ id: string; action: string }>;
}

export default async function GameActionPage({ params }: PageProps) {
  const { id, action } = await params;

  if (action !== "edit") {
    notFound();
  }

  return <GameForm gameId={Number(id)} />;
}
