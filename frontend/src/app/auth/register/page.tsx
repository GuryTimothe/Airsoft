"use client";

import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section aria-labelledby="register-title" className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 id="register-title" className="text-3xl font-bold">
            Créer un compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Créez un compte pour vous inscrire aux parties
          </p>
        </div>

        <AuthForm mode="register" />

        <div className="mt-6 text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/auth/login" className="text-primary">
            Se connecter
          </Link>
        </div>
      </section>
    </main>
  );
}
