"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h2 className="text-xl font-bold">Une erreur est survenue</h2>

      <button className="mt-4 underline" onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
