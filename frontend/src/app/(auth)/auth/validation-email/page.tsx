"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { confirmEmailVerification } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-api";

const ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ORGANIZER"];

function EmailVerificationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileHref, setProfileHref] = useState("/profil");

  useEffect(() => {
    if (!token) {
      return;
    }

    confirmEmailVerification(token)
      .then(async (verificationMessage) => {
        setMessage(verificationMessage);

        const currentUser = await getCurrentUser().catch(() => null);
        setIsAuthenticated(currentUser !== null);
        if (currentUser && ADMIN_ROLES.includes(currentUser.role)) {
          setProfileHref("/admin/profil");
        }
      })
      .catch((verificationError: unknown) => {
        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Impossible de valider cette adresse e-mail.",
        );
      });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section
        aria-labelledby="email-verification-title"
        className="w-full max-w-2xl"
      >
        <h1 id="email-verification-title" className="mb-8 text-3xl font-bold">
          Validation de l’adresse e-mail
        </h1>
        {(error || !token) && (
          <div
            role="alert"
            className="max-w-md rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error ?? "Lien : ce lien de validation est invalide ou incomplet."}
          </div>
        )}
        {message && (
          <div className="max-w-md space-y-6">
            <p
              role="status"
              className="rounded border border-border bg-muted p-3 text-sm"
            >
              {message}
            </p>
            <Link
              href={isAuthenticated ? profileHref : "/auth/login"}
              className="text-sm text-primary"
            >
              {isAuthenticated ? "Retour au profil" : "Se connecter"}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={null}>
      <EmailVerificationContent />
    </Suspense>
  );
}
