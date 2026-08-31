"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportGamesCsv } from "@/lib/export-api";

export function GamesExportControls() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(): Promise<void> {
    setIsExporting(true);
    setError(null);

    try {
      await exportGamesCsv({ dateFrom, dateTo });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de telecharger l'export parties.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Export CSV parties
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:items-end">
        <label className="space-y-2 text-sm">
          <span>Date début min</span>
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm">
          <span>Date début max</span>
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </label>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Export en cours..." : "Exporter parties CSV"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            disabled={isExporting}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
