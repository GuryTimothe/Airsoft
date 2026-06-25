"use client";

import { Hero } from "../components/Hero";

interface Party {
  id: number;
  title: string;
  date: string;
  location: string;
  paf: number;
  maxPlayers: number;
  players: number;
  waitlist: number;
  isPrivate: boolean;
}

const parties: Party[] = [
  {
    id: 1,
    title: "CQB Night Session",
    date: "2026-06-12",
    location: "Terrain Nord",
    paf: 10,
    maxPlayers: 24,
    players: 24,
    waitlist: 3,
    isPrivate: false,
  },
  {
    id: 2,
    title: "MilSim Weekend",
    date: "2026-06-20",
    location: "Forest Base Alpha",
    paf: 15,
    maxPlayers: 40,
    players: 32,
    waitlist: 0,
    isPrivate: true,
  },
  {
    id: 3,
    title: "Training Day",
    date: "2026-06-28",
    location: "CQB Indoor",
    paf: 8,
    maxPlayers: 16,
    players: 10,
    waitlist: 1,
    isPrivate: false,
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Hero />
      <main className="flex-1">
        <p> Hello world </p>
      </main>
    </div>
  );
}
