import { getAuthHeaders } from "@/lib/auth";

export type UserRole =
  | "ROLE_USER"
  | "ROLE_ADMIN"
  | "ROLE_ORGANIZER"
  | "ROLE_SUPER_ADMIN";

export interface User {
  id: number;
  lastname: string;
  firstname: string;
  email: string;
  dateOfBirth: string;
  age: number;
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  role: UserRole;
  adminNotes?: string | null;
  canSeePrivate: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserPayload {
  lastname?: string;
  firstname?: string;
  email?: string;
  password?: string;
  dateOfBirth?: string;
  age?: number;
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  role?: UserRole;
  canSeePrivate?: boolean;
  adminNotes?: string | null;
}

export interface CreateUserPayload {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  dateOfBirth: string;
  age: number;
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: string | null;
  role?: UserRole;
  canSeePrivate?: boolean;
  adminNotes?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function normalizeUser(data: unknown): User {
  const d = data as Record<string, unknown>;
  const get = (key: string) => d[key];

  return {
    id: Number(get("id") ?? 0),
    lastname: String(get("lastname") ?? ""),
    firstname: String(get("firstname") ?? ""),
    email: String(get("email") ?? ""),
    dateOfBirth: String(get("dateOfBirth") ?? ""),
    age: Number(get("age") ?? 0),
    pseudo: (get("pseudo") as string) ?? null,
    phone: (get("phone") as string) ?? null,
    emergencyContact: (get("emergencyContact") as string) ?? null,
    role: (get("role") as UserRole) ?? "ROLE_USER",
    adminNotes: (get("adminNotes") as string) ?? null,
    canSeePrivate: Boolean(get("canSeePrivate") ?? false),
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

export async function getUsers(): Promise<User[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl("/api/users"), {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les utilisateurs");
  }

  const data = await response.json();
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

  return items.map((item) => normalizeUser(item));
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de mettre a jour l'utilisateur");
  }

  return normalizeUser(await response.json());
}

export async function getUser(id: number): Promise<User> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de charger l'utilisateur");
  }

  return normalizeUser(await response.json());
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/ld+json",
  });
  const response = await fetch(buildUrl("/api/users"), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de creer l'utilisateur");
  }

  return normalizeUser(await response.json());
}

export async function deleteUser(id: number): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de supprimer l'utilisateur");
  }
}
