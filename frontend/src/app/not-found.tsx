"use client";

import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold">404</h1>

      <p className="mt-2 text-gray-500">Cette page n'existe pas.</p>

      <div className="mt-6 flex gap-4">
        <button onClick={() => router.back()} className="underline">
          Retour
        </button>

        <a href="/" className="underline">
          Accueil
        </a>
      </div>
    </div>
  );
}
