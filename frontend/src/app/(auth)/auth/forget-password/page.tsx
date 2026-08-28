"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-api";
import { isValidEmail } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setIsAuthenticated(true);
        setEmail((currentEmail) => currentEmail || user.email);
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setErrors([]);

    if (!isValidEmail(email)) {
      setErrors(["Email : veuillez saisir une adresse e-mail valide."]);
      return;
    }

    setIsSubmitting(true);
    try {
      setMessage(await requestPasswordReset(email.trim(), isAuthenticated));
    } catch (requestError) {
      setErrors([
        requestError instanceof Error
          ? requestError.message
          : "Impossible d'envoyer la demande de réinitialisation.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section
        aria-labelledby="forgot-password-title"
        className="w-full max-w-2xl"
      >
        <div className="mb-8">
          <h1 id="forgot-password-title" className="text-3xl font-bold">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-muted-foreground">
            Indiquez votre e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-4">
          {errors.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-semibold">
                Veuillez corriger les erreurs suivantes :
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          {message && (
            <div
              role="status"
              className="rounded border border-border bg-muted p-3 text-sm"
            >
              {message}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-muted-foreground">
          <Link
            href={isAuthenticated ? "/profil" : "/auth/login"}
            className="text-primary"
          >
            {isAuthenticated ? "Retour au profil" : "Retour a la connexion"}
          </Link>
        </div>
      </section>
    </main>
  );
}
