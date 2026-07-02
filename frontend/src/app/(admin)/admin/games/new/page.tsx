"use client";

import { GameForm } from "@/components/admin/game-form";

export default function NewGamePage() {
  return (
    <main className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nouvelle partie
        </h1>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations de la partie à créer.
        </p>
      </div>

      <GameForm />
    </main>
  );
}
