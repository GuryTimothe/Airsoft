import { clearAuthToken, getAuthHeaders, withCsrfHeaders } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { translateViolationMessage } from "@/lib/api-violations";

export interface Game {
  id: number;
  title: string;
  description?: string | null;
  startDateTime: string;
  address: string;
  price: number;
  maxPlaces: number;
  registrationCount: number;
  availablePlaces: number;
  full: boolean;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameFormValues {
  title: string;
  description: string;
  startDateTime: string;
  address: string;
  price: string;
  maxPlaces: string;
  isPublic: boolean;
}

export interface GamePayload {
  title: string;
  description: string;
  startDateTime: string;
  address: string;
  price: number;
  maxPlaces: number;
  isPublic: boolean;
}

export interface CollectionView {
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
}

export interface GamesResult {
  games: Game[];
  view?: CollectionView;
  totalItems?: number;
}

export class GameValidationError extends Error {
  readonly messages: string[];

  constructor(messages: string[]) {
    super(messages[0] ?? "Une erreur est survenue.");
    this.name = "GameValidationError";
    this.messages = messages;
  }
}

const GAME_FIELD_LABELS: Record<string, string> = {
  title: "Titre",
  description: "Description",
  startDateTime: "Date et heure",
  address: "Adresse",
  price: "PAF",
  maxPlaces: "Places max",
  isPublic: "Partie privee",
};

async function parseGameErrorMessages(response: Response): Promise<string[]> {
  const fallback = "Une erreur est survenue.";
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    return [fallback];
  }

  if (typeof data !== "object" || data === null) {
    return [fallback];
  }

  const violations = (data as { violations?: unknown }).violations;
  if (Array.isArray(violations) && violations.length > 0) {
    return violations.map((violation) => {
      const v = violation as { propertyPath?: unknown; message?: unknown };
      const field =
        typeof v.propertyPath === "string"
          ? (GAME_FIELD_LABELS[v.propertyPath] ?? v.propertyPath)
          : null;
      const message =
        typeof v.message === "string"
          ? translateViolationMessage(v.message)
          : "Valeur invalide.";

      return field ? `${field} : ${message}` : message;
    });
  }

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return [translateViolationMessage(detail)];
  }

  const message = (data as { message?: unknown }).message;
  if (typeof message === "string" && message.trim()) {
    return [translateViolationMessage(message)];
  }

  return [fallback];
}

const API_BASE_URL = getApiBaseUrl();

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function normalizeGame(data: unknown): Game {
  const d = data as Record<string, unknown>;

  const get = (k: string) => d[k];

  return {
    id: Number(get("id") ?? 0),
    title: String(get("title") ?? ""),
    description: (get("description") as string) ?? null,
    startDateTime: String(get("startDateTime") ?? get("start_date") ?? ""),
    address: String(get("address") ?? ""),
    price: Number(get("price") ?? 0),
    maxPlaces: Number(get("maxPlaces") ?? get("max_places") ?? 0),
    registrationCount: Number(
      get("registrationCount") ?? get("registration_count") ?? 0,
    ),
    availablePlaces: Number(
      get("availablePlaces") ?? get("available_places") ?? 0,
    ),
    full: Boolean(get("full") ?? false),
    isPublic: Boolean(get("isPublic") ?? get("public") ?? false),
    createdAt:
      (get("createdAt") as string) ??
      (get("created_at") as string) ??
      undefined,
    updatedAt:
      (get("updatedAt") as string) ??
      (get("updated_at") as string) ??
      undefined,
  };
}

export async function getGamesPage(page?: number): Promise<GamesResult> {
  const headers = await getAuthHeaders();
  const url =
    page && page > 1
      ? buildUrl(`/api/games?page=${page}`)
      : buildUrl("/api/games");
  let response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  // If auth cookie/header is stale, retry the public games endpoint without auth.
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      clearAuthToken();
    }
    response = await fetch(url, {
      cache: "no-store",
      credentials: "omit",
    });
  }

  if (!response.ok) {
    throw new Error("Impossible de charger les parties");
  }

  const data = await response.json();

  // API Platform (JSON-LD) returns an object with `hydra:member`.
  // Some setups or mock servers may return a plain array.
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (Array.isArray(data["hydra:member"])) {
    items = data["hydra:member"];
  } else if (Array.isArray(data["member"])) {
    items = data["member"];
  } else if (Array.isArray(data["items"])) {
    items = data["items"];
  }

  const rawView =
    (data["hydra:view"] as Record<string, string> | undefined) ??
    (data["view"] as Record<string, string> | undefined);
  const view: CollectionView | undefined = rawView
    ? {
        first: rawView["first"],
        last: rawView["last"],
        next: rawView["next"],
        previous: rawView["previous"],
      }
    : undefined;

  const totalItems = Number(data["hydra:totalItems"] ?? data["totalItems"]);

  return {
    games: items.map((it) => normalizeGame(it)),
    view,
    totalItems: Number.isFinite(totalItems) ? totalItems : undefined,
  };
}

export async function getGames(): Promise<Game[]> {
  const { games } = await getGamesPage();

  return games;
}

export async function getGame(id: number): Promise<Game> {
  const headers = await getAuthHeaders();
  let response = await fetch(buildUrl(`/api/games/${id}`), {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      clearAuthToken();
    }
    response = await fetch(buildUrl(`/api/games/${id}`), {
      cache: "no-store",
      credentials: "omit",
    });
  }

  if (!response.ok) {
    throw new Error("Impossible de charger la partie");
  }

  return normalizeGame(await response.json());
}

export async function createGame(payload: GamePayload): Promise<Game> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/ld+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/games"), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new GameValidationError(await parseGameErrorMessages(response));
  }

  return normalizeGame(await response.json());
}

export async function updateGame(
  id: number,
  payload: GamePayload,
): Promise<Game> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/ld+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl(`/api/games/${id}`), {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new GameValidationError(await parseGameErrorMessages(response));
  }

  return normalizeGame(await response.json());
}

export async function deleteGame(id: number): Promise<void> {
  let headers = await getAuthHeaders();
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl(`/api/games/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de supprimer la partie");
  }
}
