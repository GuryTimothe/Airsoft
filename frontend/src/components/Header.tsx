"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-primary">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black text-primary-foreground">
          Muret Airsoft
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="#"
            className="text-sm font-medium text-primary-foreground transition-colors hover:text-primary"
          >
            Parties
          </Link>

          <Link
            href="#"
            className="text-sm font-medium text-primary-foreground transition-colors hover:text-primary"
          >
            À propos
          </Link>

          <Link
            href="#"
            className="text-sm font-medium text-primary-foreground transition-colors hover:text-primary"
          >
            Contact
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-sm font-medium text-primary-foreground">
              Connexion
            </Button>
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
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Parties
            </Link>

            <Link
              href="#"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              À propos
            </Link>

            <Link
              href="#"
              className="block text-sm font-medium transition-colors hover:text-primary"
            >
              Contact
            </Link>

            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" className="flex-1">
                <Button variant="default" className="w-full text-sm">
                  Connexion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
