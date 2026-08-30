"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-accent text-accent-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 items-start">
          <div>
            <div className="mb-4">
              <Image
                src="/images/logo.png"
                alt="Logo"
                className="ml-4 h-25 w-20"
                width={80}
                height={100}
                sizes="80px"
              />
              <h3 className="text-lg font-bold">Muret Airsoft</h3>
            </div>
          </div>
          <div className="">
            <div className="text-sm space-y-1">
              <p>
                <span className="font-bold">Adresse :</span> Chemin de la
                hilière, 31600 Muret
              </p>
              <p>
                <span className="font-bold">Email : </span>
                <a
                  href="mailto:contact@aem.fr"
                  className="hover:underline transition-colors"
                >
                  muret.airsoft@gmail.com
                </a>
              </p>
              <p>
                <span className="font-bold">Téléphone :</span> 06 51 71 68 58
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm ">
            <p>© 2026 Muret Airsoft - Tous droits réservés.</p>

            <div className="flex gap-4">
              <Link
                href="/politique-confidentialite"
                className="hover:underline transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href="/conditions-utilisation"
                className="hover:underline transition-colors"
              >
                {"Conditions d'utilisation"}
              </Link>
              <Link
                href="/mentions-legales"
                className="hover:underline transition-colors"
              >
                Mentions légales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
