import type { LoginInput } from "@/lib/schemas/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";

const API_BASE_URL = getApiBaseUrl();
export const AUTH_TOKEN_KEY = "ma_access_token";
export const AUTH_STATE_CHANGE_EVENT = "auth-state-changed";
const INVALID_CREDENTIALS_MESSAGE = "Identifiants invalides.";
const LOGIN_CSRF_HEADER_NAME = "X-CSRF-Token";
const CSRF_TOKEN_ENDPOINT = "/api/csrf/token";

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function fetchCsrfToken(): Promise<string> {
  const csrfTokenResponse = await fetch(buildUrl(CSRF_TOKEN_ENDPOINT), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  let csrfTokenData: unknown = null;
  try {
    csrfTokenData = await csrfTokenResponse.json();
  } catch {
    csrfTokenData = null;
  }

  const csrfToken =
    typeof csrfTokenData === "object" &&
    csrfTokenData !== null &&
    typeof (csrfTokenData as { csrfToken?: unknown }).csrfToken === "string"
      ? (csrfTokenData as { csrfToken: string }).csrfToken
      : "";

  if (!csrfTokenResponse.ok || !csrfToken) {
    throw new Error("Impossible d'initialiser la session.");
  }

  return csrfToken;
}

export async function withCsrfHeaders(
  headers: HeadersInit = {},
): Promise<HeadersInit> {
  const csrfToken = await fetchCsrfToken();

  return {
    ...headers,
    [LOGIN_CSRF_HEADER_NAME]: csrfToken,
  };
}

async function parseApiErrorMessage(response: Response): Promise<string> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (typeof data === "object" && data !== null) {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Une erreur est survenue.";
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

export function getAuthToken(): string | null {
  // JWT is intentionally kept in an httpOnly cookie and must not be exposed to browser JS.
  return null;
}

export function setAuthToken(_token: string): void {
  void _token;

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
}

export async function logout(): Promise<void> {
  const response = await fetch(buildUrl("/api/logout"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok && response.status !== 401) {
    throw new Error(await parseApiErrorMessage(response));
  }

  clearAuthToken();
}

export function isAuthenticated(): boolean {
  return null !== getAuthToken();
}

type JwtPayload = {
  roles?: unknown;
  role?: unknown;
  exp?: unknown;
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

function getTokenExpirationTimestamp(token: string | null): number | null {
  const payload = parseJwtPayload(token);
  if (
    !payload ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp)
  ) {
    return null;
  }

  return payload.exp * 1000;
}

function isTokenExpired(token: string | null): boolean {
  const expirationTimestamp = getTokenExpirationTimestamp(token);
  if (expirationTimestamp === null) {
    return false;
  }

  return Date.now() >= expirationTimestamp;
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

    const token = cookieStore.get(AUTH_TOKEN_KEY)?.value ?? null;

    return isTokenExpired(token) ? null : token;
  } catch {
    return null;
  }
}

export async function getAuthHeaders(
  headers: HeadersInit = {},
): Promise<HeadersInit> {
  if (typeof window !== "undefined") {
    return headers;
  }

  const token = await getServerAuthToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export async function login(payload: LoginInput): Promise<string> {
  const headers = await withCsrfHeaders({
    "Content-Type": "application/json",
  });

  const response = await fetch(buildUrl("/api/login"), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  try {
    await response.json();
  } catch {
    // Ignore non-JSON login responses; the auth cookie is set by the backend.
  }

  if (!response.ok) {
    throw new Error(INVALID_CREDENTIALS_MESSAGE);
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));

  return "";
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

export async function requestPasswordReset(
  email: string,
  renewSession = false,
): Promise<string> {
  let headers: HeadersInit = { "Content-Type": "application/json" };
  if (renewSession) {
    headers = await withCsrfHeaders(headers);
  }

  const response = await fetch(
    buildUrl(
      renewSession
        ? "/api/me/password-reset/request"
        : "/api/password-reset/request",
    ),
    {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ email }),
    },
  );

  const data = (await response.json().catch(() => null)) as {
    message?: unknown;
    token?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error("Impossible d'envoyer la demande de réinitialisation.");
  }

  return typeof data?.message === "string"
    ? data.message
    : "Si un compte correspond a cette adresse, un e-mail de réinitialisation vient d'être envoyé.";
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<boolean> {
  const response = await fetch(buildUrl("/api/password-reset/confirm"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }

  const data = (await response.json().catch(() => null)) as {
    token?: unknown;
  } | null;
  const sessionRenewed = typeof data?.token === "string" && data.token !== "";
  if (sessionRenewed) {
    setAuthToken("");
  }

  return sessionRenewed;
}

export async function confirmEmailVerification(token: string): Promise<string> {
  const response = await fetch(buildUrl("/api/email-verification/confirm"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = (await response.json().catch(() => null)) as {
    message?: unknown;
    token?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Impossible de valider cette adresse e-mail.",
    );
  }

  if (typeof data?.token === "string" && data.token) {
    setAuthToken("");
  }

  return typeof data?.message === "string"
    ? data.message
    : "Votre adresse e-mail est validée.";
}
