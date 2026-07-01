import { GameForm } from "@/components/admin/game-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGamePage({ params }: PageProps) {
  const { id } = await params;
  return <GameForm gameId={Number(id)} />;
}
