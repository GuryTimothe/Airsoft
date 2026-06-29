"use client";

import { Hero } from "../components/Hero";
import { GameListCard } from "../components/GameListCard";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Hero />
      <main className="flex-1 mx-10 lg:mx-40 my-10">
        <GameListCard />
      </main>
    </div>
  );
}
