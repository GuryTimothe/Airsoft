import type { LoginInput } from "@/lib/schemas/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const AUTH_TOKEN_KEY = "ma_access_token";
export const AUTH_STATE_CHANGE_EVENT = "auth-state-changed";

/**
 * Build full API URL from relative path
 * @param path - Relative API path (e.g., "/api/users")
 * @returns Full URL
 */
function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

type RegisterPayload = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  dateOfBirth: string;
  emergencyContact?: string;
  pseudo?: string;
  phone?: string;
};

/**
 * Get cookie value by name
 * Safe for server and client rendering
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
function getBrowserCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  if (!match) {
    return null;
  }

  try {
    /**
     * Get current auth token from localStorage or cookies
     * Syncs cookie to localStorage if found
     * @returns Auth token or null if not authenticated
     */
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return match.slice(prefix.length);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const localStorageToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (localStorageToken) {
    return localStorageToken;
  }

  const cookieToken = getBrowserCookieValue(AUTH_TOKEN_KEY);
  if (cookieToken) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
  }

  return cookieToken;
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

export function isAuthenticated(): boolean {
  return null !== getAuthToken();
}

type JwtPayload = {
  roles?: unknown;
  role?: unknown;
};

function parseJwtPayload(token: string | null): JwtPayload | null {
  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(normalized, "base64").toString("utf-8")
        : atob(normalized);
    const parsed = JSON.parse(decoded) as JwtPayload;

    return parsed;
  } catch {
    return null;
  }
}

export function getRolesFromToken(token: string | null): string[] {
  const payload = parseJwtPayload(token);
  if (!payload) {
    return [];
  }

  return Array.isArray(payload.roles)
    ? payload.roles.filter((role): role is string => typeof role === "string")
    : typeof payload.role === "string"
      ? [payload.role]
      : [];
}

export function getUserIdentifierFromToken(
  token: string | null,
): string | null {
  const candidates = getUserIdentifierCandidatesFromToken(token);

  return candidates[0] ?? null;
}

export function getUserIdentifierCandidatesFromToken(
  token: string | null,
): string[] {
  const payload = parseJwtPayload(token) as
    | (JwtPayload & {
        email?: unknown;
        username?: unknown;
        user_identifier?: unknown;
        sub?: unknown;
      })
    | null;

  if (!payload) {
    return [];
  }

  const candidates = [
    payload.email,
    payload.username,
    payload.user_identifier,
    payload.sub,
  ];

  return candidates
    .filter((candidate): candidate is string => typeof candidate === "string")
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate !== "");
}

export function hasAdminAccessToken(): boolean {
  const roles = getRolesFromToken(getAuthToken());

  return roles.some((role) =>
    ["ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_ORGANIZER"].includes(role),
  );
}

async function getServerAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    return cookieStore.get(AUTH_TOKEN_KEY)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getAuthHeaders(
  headers: HeadersInit = {},
): Promise<HeadersInit> {
  const token =
    typeof window !== "undefined" ? getAuthToken() : await getServerAuthToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export async function login(payload: LoginInput): Promise<string> {
  const response = await fetch(buildUrl("/api/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      typeof (data as { message?: unknown }).message === "string"
        ? (data as { message: string }).message
        : "Email ou mot de passe invalide.";

    throw new Error(errorMessage);
  }

  const token =
    typeof data === "object" &&
    data !== null &&
    typeof (data as { token?: unknown }).token === "string"
      ? (data as { token: string }).token
      : null;

  if (!token) {
    throw new Error("Réponse de connexion invalide: token manquant.");
  }

  setAuthToken(token);

  return token;
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  const response = await fetch(buildUrl("/api/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/ld+json",
    },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage =
      typeof data === "object" &&
      data !== null &&
      typeof (data as { detail?: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : "Impossible de créer le compte.";

    throw new Error(errorMessage);
  }
}
