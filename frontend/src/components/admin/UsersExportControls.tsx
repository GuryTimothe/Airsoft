"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportUsersCsv } from "@/lib/export-api";
import type { UserRole } from "@/lib/user-api";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "ROLE_USER", label: "Utilisateur" },
  { value: "ROLE_ADMIN", label: "Admin" },
  { value: "ROLE_ORGANIZER", label: "Organisateur" },
  { value: "ROLE_SUPER_ADMIN", label: "Super Admin" },
];

export function UsersExportControls() {
  const [ageGroup, setAgeGroup] = useState<"mineur" | "majeur" | "tous">(
    "tous",
  );
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(role: UserRole, checked: boolean): void {
    setRoles((current) => {
      if (checked) {
        return current.includes(role) ? current : [...current, role];
      }

      return current.filter((item) => item !== role);
    });
  }

  async function handleExport(): Promise<void> {
    setIsExporting(true);
    setError(null);

    try {
      await exportUsersCsv({ ageGroup, roles });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de telecharger l'export users.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Export CSV utilisateurs
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3 md:items-end">
        <label className="space-y-2 text-sm">
          <span>Age</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={ageGroup}
            onChange={(event) =>
              setAgeGroup(event.target.value as "mineur" | "majeur" | "tous")
            }
          >
            <option value="tous">Mineur et majeur</option>
            <option value="mineur">Mineur</option>
            <option value="majeur">Majeur</option>
          </select>
        </label>

        <fieldset className="space-y-2 text-sm md:col-span-2">
          <legend>Roles</legend>
          <div className="flex flex-wrap gap-3">
            {ROLE_OPTIONS.map((role) => (
              <label
                key={role.value}
                className="inline-flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={roles.includes(role.value)}
                  onChange={(event) =>
                    toggleRole(role.value, event.target.checked)
                  }
                />
                <span>{role.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button type="button" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Export en cours..." : "Exporter users CSV"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAgeGroup("tous");
            setRoles([]);
          }}
          disabled={isExporting}
        >
          Reinitialiser filtres export
        </Button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
