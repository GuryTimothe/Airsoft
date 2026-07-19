import { getAuthHeaders } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";
import type { UserRole } from "@/lib/user-api";

const API_BASE_URL = getApiBaseUrl();

type AgeGroupFilter = "mineur" | "majeur" | "tous";

type GamesExportFilters = {
  dateFrom?: string;
  dateTo?: string;
};

type UsersExportFilters = {
  ageGroup: AgeGroupFilter;
  roles: UserRole[];
};

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function buildQueryString(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    params.set(key, value);
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function getFilenameFromResponse(response: Response, fallback: string): string {
  const contentDisposition = response.headers.get("content-disposition") ?? "";
  const match = contentDisposition.match(/filename="([^"]+)"/i);

  if (!match || !match[1]) {
    return fallback;
  }

  return match[1];
}

async function downloadCsv(
  path: string,
  fallbackFilename: string,
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible de telecharger l'export CSV.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = getFilenameFromResponse(response, fallbackFilename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function exportGamesCsv(
  filters: GamesExportFilters,
): Promise<void> {
  const query = buildQueryString({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });

  return downloadCsv(`/api/exports/games.csv${query}`, "games_export.csv");
}

export async function exportUsersCsv(
  filters: UsersExportFilters,
): Promise<void> {
  const query = buildQueryString({
    ageGroup: filters.ageGroup,
    roles: filters.roles.length > 0 ? filters.roles.join(",") : undefined,
  });

  return downloadCsv(`/api/exports/users.csv${query}`, "users_export.csv");
}

export async function exportGameRegistrationsCsv(
  gameId: number,
): Promise<void> {
  return downloadCsv(
    `/api/exports/games/${gameId}/registrations.csv`,
    `game_${gameId}_registrations_export.csv`,
  );
}
