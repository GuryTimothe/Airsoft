"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Clock,
  Lock,
  ArrowRight,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

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

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black text-primary">
          AEM
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Parties
          </Link>

          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            À propos
          </Link>

          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm font-medium">
              Connexion
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button>S&apos;inscrire</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="space-y-4 px-6 py-4">
            <Link
              href="#"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Parties
            </Link>

            <Link
              href="#"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              À propos
            </Link>

            <Link
              href="#"
              className="block text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Contact
            </Link>

            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="flex-1">
                <Button variant="outline" className="w-full text-sm">
                  Connexion
                </Button>
              </Link>

              <Link href="/auth/register" className="flex-1">
                <Button className="w-full text-sm">S&apos;inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative h-96 w-full overflow-hidden md:h-[500px]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1618519764d7651dab61a6c4c0a1455b4c4b6d7e?w=1200&h=500&fit=crop")',
        }}
      >
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative flex h-full items-center px-6 sm:px-8">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-4xl font-black leading-tight text-white md:text-5xl">
            Les meilleures parties airsoft
          </h1>

          <p className="mb-6 max-w-xl text-lg leading-relaxed text-white/80">
            Découvrez une communauté passionnée d&apos;airsoft. Inscrivez-vous à
            nos événements, gérez votre liste d&apos;attente et trouvez vos
            équipes idéales.
          </p>

          <Button className="h-12 px-6 text-base">
            Voir les parties
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function EventCard({ party, index }: { party: Party; index: number }) {
  const isFull = party.players >= party.maxPlayers;
  const fillPercentage = (party.players / party.maxPlayers) * 100;

  return (
    <div
      style={{
        animation: `slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${
          index * 0.15
        }s both`,
      }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden border-border bg-card text-card-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
        {/* Top accent line */}
        <div
          className={`absolute inset-x-0 top-0 h-1 transition-all duration-300 ${
            isFull
              ? "bg-gradient-to-r from-orange-400 via-red-400 to-orange-400"
              : "bg-gradient-to-r from-primary via-cyan-400 to-primary"
          }`}
        />

        <CardHeader className="relative space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex-1 text-lg leading-tight text-foreground">
              {party.title}
            </CardTitle>

            <div className="flex shrink-0 gap-2">
              {party.isPrivate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Privée</span>
                </Badge>
              )}

              {isFull && <Badge variant="destructive">Complet</Badge>}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {party.players}/{party.maxPlayers} joueurs
              </span>

              <span
                className={`font-semibold ${
                  isFull ? "text-destructive" : "text-primary"
                }`}
              >
                {Math.round(fillPercentage)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull
                    ? "bg-gradient-to-r from-orange-400 to-red-400"
                    : "bg-gradient-to-r from-primary to-cyan-400"
                }`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4 text-sm">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Date
                </p>

                <time className="text-sm font-semibold text-foreground">
                  {new Date(party.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Terrain
                </p>

                <p className="truncate font-semibold text-foreground">
                  {party.location}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  PAF
                </p>

                <p className="font-semibold text-foreground">{party.paf}€</p>
              </div>
            </div>

            {/* Waitlist */}
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />

              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Attente
                </p>

                <p
                  className={`font-semibold ${
                    party.waitlist > 0
                      ? "text-purple-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {party.waitlist > 0 ? `+${party.waitlist}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-2" />

          {/* Action */}
          <Link href="/auth/register" className="w-full">
            <Button
              className="group/btn w-full"
              variant={isFull ? "secondary" : "default"}
            >
              <span className="flex items-center gap-2">
                {isFull ? "Liste d'attente" : "S'inscrire"}

                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-foreground">AEM</h3>

            <p className="text-sm text-muted-foreground">
              Airsoft Event Manager - Gérez vos parties avec style
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Produit
            </h4>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Parties
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Événements
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Entreprise
            </h4>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  À propos
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Blog
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Carrières
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Légal
            </h4>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Confidentialité
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Conditions
                </Link>
              </li>

              <li>
                <Link
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2026 Airsoft Event Manager. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <Hero />

      {/* Events */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl space-y-8 px-6 py-16">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
              Prochaines parties
            </h2>

            <p className="text-lg text-muted-foreground">
              {parties.length} événements programmés • Rejoignez une communauté
              de passionnés
            </p>
          </div>

          <div
            className="grid gap-6 md:grid-cols-3"
            role="region"
            aria-label="Liste des parties à venir"
          >
            {parties.map((party, index) => (
              <EventCard key={party.id} party={party} index={index} />
            ))}
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
