"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportGameRegistrationsCsv } from "@/lib/export-api";

type GameRegistrationsExportButtonProps = {
  gameId: number;
};

export function GameRegistrationsExportButton({
  gameId,
}: GameRegistrationsExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(): Promise<void> {
    setIsExporting(true);
    setError(null);

    try {
      await exportGameRegistrationsCsv(gameId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de telecharger l'export des inscrits.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        onClick={handleExport}
        disabled={isExporting}
      >
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "Export en cours..." : "Exporter inscrits CSV"}
      </Button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
