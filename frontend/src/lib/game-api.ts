export interface Game {
  id: number;
  title: string;
  description?: string | null;
  startDateTime: string;
  address: string;
  price: number;
  maxPlaces: number;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export async function getGames(): Promise<Game[]> {
  const response = await fetch(buildUrl("/api/games"), {
    cache: "no-store",
  });

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

  return items.map((it) => normalizeGame(it));
}

export async function getGame(id: number): Promise<Game> {
  const response = await fetch(buildUrl(`/api/games/${id}`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de charger la partie");
  }

  return normalizeGame(await response.json());
}

export async function createGame(payload: GamePayload): Promise<Game> {
  const response = await fetch(buildUrl("/api/games"), {
    method: "POST",
    headers: {
      "Content-Type": "application/ld+json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de créer la partie");
  }

  return normalizeGame(await response.json());
}

export async function updateGame(
  id: number,
  payload: GamePayload,
): Promise<Game> {
  const response = await fetch(buildUrl(`/api/games/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/ld+json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de modifier la partie");
  }

  return normalizeGame(await response.json());
}

export async function deleteGame(id: number): Promise<void> {
  const response = await fetch(buildUrl(`/api/games/${id}`), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Impossible de supprimer la partie");
  }
}
