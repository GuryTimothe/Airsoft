import type { LoginInput } from "@/lib/schemas/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const AUTH_TOKEN_KEY = "ma_access_token";

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

export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function isAuthenticated(): boolean {
  return null !== getAuthToken();
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
