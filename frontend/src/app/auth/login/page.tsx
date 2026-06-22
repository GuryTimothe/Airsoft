"use client"

import Link from "next/link"
import AuthForm from "@/components/auth/AuthForm"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section aria-labelledby="login-title" className="w-full max-w-2xl">
        <div className="mb-8">
          <h1 id="login-title" className="text-3xl font-bold">
            Connexion
          </h1>
          <p className="text-sm text-muted-foreground">Connectez-vous pour gérer vos inscriptions</p>
        </div>

        <AuthForm mode="login" />

        <div className="mt-6 text-sm text-muted-foreground">
          Pas de compte ? <Link href="/auth/register" className="text-primary">Créer un compte</Link>
        </div>
      </section>
    </main>
  )
}
