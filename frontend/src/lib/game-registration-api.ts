import {
  getAuthHeaders,
  getAuthToken,
  getUserIdentifierCandidatesFromToken,
} from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export interface GameRegistration {
  id: number;
  gameId: number;
  userId: number;
  userFirstname: string | null;
  userLastname: string | null;
  userEmail: string | null;
  isPresent: boolean;
  createdAt: string;
}

function parseIdFromIri(value: unknown): number {
  if (typeof value !== "string") {
    return 0;
  }

  const match = value.match(/\/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number(match[1] ?? 0);
}

function toPositiveInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 0;
  }

  return Math.trunc(n);
}

function firstPositive(values: number[]): number {
  for (const value of values) {
    if (value > 0) {
      return value;
    }
  }

  return 0;
}

function parseRelationId(value: unknown): number {
  if (typeof value === "number") {
    return toPositiveInt(value);
  }

  if (typeof value === "string") {
    return firstPositive([parseIdFromIri(value), toPositiveInt(value)]);
  }

  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;

    if (typeof v.id === "number" || typeof v.id === "string") {
      return toPositiveInt(v.id);
    }

    if (typeof v["@id"] === "string") {
      return parseIdFromIri(v["@id"]);
    }
  }

  return 0;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off", ""].includes(normalized)) {
      return false;
    }
  }

  return false;
}

function normalizeGameRegistration(data: unknown): GameRegistration {
  const d = data as Record<string, unknown>;
  const userObject =
    typeof d.user === "object" && d.user !== null
      ? (d.user as Record<string, unknown>)
      : null;

  return {
    id: toPositiveInt(d.id),
    gameId: firstPositive([
      toPositiveInt(d.gameId),
      toPositiveInt(d.game_id),
      parseRelationId(d.game),
      parseRelationId(d.game_id),
    ]),
    userId: firstPositive([
      toPositiveInt(d.userId),
      toPositiveInt(d.user_id),
      parseRelationId(d.user),
      parseRelationId(d.user_id),
    ]),
    userFirstname:
      typeof d.userFirstname === "string"
        ? d.userFirstname
        : typeof userObject?.firstname === "string"
          ? userObject.firstname
          : null,
    userLastname:
      typeof d.userLastname === "string"
        ? d.userLastname
        : typeof userObject?.lastname === "string"
          ? userObject.lastname
          : null,
    userEmail:
      typeof d.userEmail === "string"
        ? d.userEmail
        : typeof userObject?.email === "string"
          ? userObject.email
          : null,
    isPresent: toBoolean(
      d.isPresent ?? d.is_present ?? d.present ?? d.presence ?? false,
    ),
    createdAt: String(d.createdAt ?? ""),
  };
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const objectPayload = payload as { [key: string]: unknown };

    if (Array.isArray(objectPayload["hydra:member"])) {
      return objectPayload["hydra:member"] as unknown[];
    }

    if (Array.isArray(objectPayload.member)) {
      return objectPayload.member as unknown[];
    }

    if (Array.isArray(objectPayload.items)) {
      return objectPayload.items as unknown[];
    }

    if (Array.isArray(objectPayload.data)) {
      return objectPayload.data as unknown[];
    }
  }

  return [];
}

async function fetchAllRegistrations(
  headers: HeadersInit,
): Promise<GameRegistration[]> {
  const response = await fetch(buildUrl("/api/game_registrations"), {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les inscriptions.");
  }

  const payload = await response.json();
  return extractItems(payload).map((item) => normalizeGameRegistration(item));
}

function getCurrentUserCandidates(): Set<string> {
  const token = getAuthToken();
  const values = getUserIdentifierCandidatesFromToken(token).map((value) =>
    value.toLowerCase(),
  );

  return new Set(values);
}

function belongsToCurrentUser(
  registration: GameRegistration,
  currentUserCandidates: Set<string>,
): boolean {
  if (currentUserCandidates.size === 0) {
    return false;
  }

  const email = registration.userEmail?.toLowerCase();
  const userId = String(registration.userId);

  return (
    currentUserCandidates.has(userId) ||
    Boolean(email && currentUserCandidates.has(email))
  );
}

function filterToCurrentUser(
  registrations: GameRegistration[],
): GameRegistration[] {
  const currentUserCandidates = getCurrentUserCandidates();

  return registrations.filter((registration) =>
    belongsToCurrentUser(registration, currentUserCandidates),
  );
}

export async function getMyGameRegistrations(): Promise<GameRegistration[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl("/api/game_registrations/mine"), {
    headers,
    cache: "no-store",
  });

  if (response.ok) {
    const payload = await response.json();
    const items = extractItems(payload).map((item) =>
      normalizeGameRegistration(item),
    );

    return filterToCurrentUser(items);
  }

  // Fallback for environments where the custom /mine operation is unavailable.
  const all = await fetchAllRegistrations(headers);

  return filterToCurrentUser(all);
}

export async function getGameRegistrationsByGameId(
  gameId: number,
): Promise<GameRegistration[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    buildUrl(`/api/game_registrations?game.id=${gameId}`),
    {
      headers,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    // Some setups may reject this filtered URL with 404 even when the collection exists.
    if (response.status === 404) {
      const all = await fetchAllRegistrations(headers);
      return all.filter((registration) => registration.gameId === gameId);
    }

    throw new Error("Impossible de charger la liste des inscrits.");
  }

  const payload = await response.json();
  const items = extractItems(payload).map((item) =>
    normalizeGameRegistration(item),
  );

  if (items.length > 0) {
    return items;
  }

  // Fallback to local filtering when API query filters are not applied.
  const all = await fetchAllRegistrations(headers);
  return all.filter((registration) => registration.gameId === gameId);
}

export async function registerToGame(
  gameId: number,
): Promise<GameRegistration> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/ld+json",
  });
  const response = await fetch(buildUrl("/api/game_registrations"), {
    method: "POST",
    headers,
    body: JSON.stringify({ game: `/api/games/${gameId}` }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible de finaliser l'inscription.");
  }

  return normalizeGameRegistration(await response.json());
}

export async function cancelGameRegistration(
  registrationId: number,
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    buildUrl(`/api/game_registrations/${registrationId}`),
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible d'annuler l'inscription.");
  }
}

export async function updateGameRegistrationPresence(
  registrationId: number,
  isPresent: boolean,
): Promise<GameRegistration> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(
    buildUrl(`/api/game_registrations/${registrationId}/presence`),
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ present: isPresent, isPresent }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible de mettre a jour la presence.");
  }

  const rawBody = await response.text();

  if (rawBody.trim() === "") {
    return {
      id: registrationId,
      gameId: 0,
      userId: 0,
      userFirstname: null,
      userLastname: null,
      userEmail: null,
      isPresent,
      createdAt: "",
    };
  }

  try {
    return normalizeGameRegistration(JSON.parse(rawBody));
  } catch {
    return {
      id: registrationId,
      gameId: 0,
      userId: 0,
      userFirstname: null,
      userLastname: null,
      userEmail: null,
      isPresent,
      createdAt: "",
    };
  }
}
