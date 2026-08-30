"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user-api";
import { validatePasswordPolicy } from "@/lib/password-policy";

const ADMIN_ROLES = ["ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ORGANIZER"];

function passwordErrors(password: string): string[] {
  return validatePasswordPolicy(password).map(
    (message) => `Nouveau mot de passe : ${message}`,
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionRenewed, setSessionRenewed] = useState(false);
  const [profileHref, setProfileHref] = useState("/profil");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);

    const token = searchParams.get("token") ?? "";
    const validationErrors: string[] = [];

    if (!token) {
      validationErrors.push(
        "Lien : ce lien de réinitialisation est invalide ou incomplet.",
      );
    }
    validationErrors.push(...passwordErrors(password));
    if (password !== confirmation) {
      validationErrors.push(
        "Confirmation : la confirmation ne correspond pas au nouveau mot de passe.",
      );
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const renewed = await resetPassword(token, password);
      setSessionRenewed(renewed);
      if (renewed) {
        const currentUser = await getCurrentUser().catch(() => null);
        if (currentUser && ADMIN_ROLES.includes(currentUser.role)) {
          setProfileHref("/admin/profil");
        }
      }
      setIsComplete(true);
    } catch (requestError) {
      setErrors([
        requestError instanceof Error
          ? requestError.message
          : "Impossible de réinitialiser le mot de passe.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section
        aria-labelledby="reset-password-title"
        className="w-full max-w-2xl"
      >
        <div className="mb-8">
          <h1 id="reset-password-title" className="text-3xl font-bold">
            Nouveau mot de passe
          </h1>
        </div>

        {isComplete ? (
          <div className="max-w-md space-y-6">
            <p
              role="status"
              className="rounded border border-border bg-muted p-3 text-sm"
            >
              Votre mot de passe a été mis a jour.
            </p>
            <Link
              href={sessionRenewed ? profileHref : "/auth/login"}
              className="text-sm text-primary"
            >
              {sessionRenewed ? "Retour au profil" : "Aller a la connexion"}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-w-md space-y-4"
          >
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
            <div>
              <label
                htmlFor="password"
                className="block text-sm text-muted-foreground"
              >
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label
                htmlFor="confirmation"
                className="block text-sm text-muted-foreground"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmation"
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Mise a jour..."
                : "Mettre a jour le mot de passe"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
