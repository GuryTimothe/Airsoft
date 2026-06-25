"use client";

import Link from "next/link";

export function Footer() {
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