"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-accent">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 items-start">
          {/* GAUCHE : logo + contact */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-accent-foreground">AEM</h3>
              <p className="text-sm text-accent-foreground">
                Airsoft Event Manager - Gérez vos parties avec style
              </p>
            </div>

            <div className="text-sm text-accent-foreground space-y-1">
              <p>Adresse : chemin de la hilière</p>
              <p>Email : contact@aem.fr</p>
              <p>Téléphone : +33 6 00 00 00 00</p>
            </div>
          </div>

          <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1992.9328663508234!2d1.1005076677664634!3d43.39535856406754!2m3!1f0!2f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sfr!2sfr!4v1782400895498!5m2!1sfr!2sfr"
              className="w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-accent-foreground">
            <p>© 2026 Airsoft Event Manager. Tous droits réservés.</p>

            <div className="flex gap-4">
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href="#"
                className="hover:text-accent-foreground transition-colors"
              >
                Conditions
              </Link>
              <Link
                href="#"
                className="hover:text-accent-foreground transition-colors"
              >
                Données
              </Link>
              <Link
                href="#"
                className="hover:text-accent-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
