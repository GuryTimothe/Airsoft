import { getAuthHeaders } from "@/lib/auth";
import {
  parseEmergencyContact,
  type EmergencyContactFields,
} from "@/lib/emergency-contact";

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
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: EmergencyContactFields | null;
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
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: EmergencyContactFields | null;
  role?: UserRole;
  canSeePrivate?: boolean;
  adminNotes?: string | null;
}

export interface CollectionView {
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
}

export interface UsersResult {
  users: User[];
  view?: CollectionView;
}

export interface UpdateMyProfilePayload {
  lastname?: string;
  firstname?: string;
  dateOfBirth?: string;
  pseudo?: string | null;
  phone?: string | null;
}

export interface UpdateMyEmailPayload {
  email: string;
  currentPassword: string;
}

export interface UpdateMyPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface SelfUserUpdateResult {
  user: User;
  token: string;
}

export interface CreateUserPayload {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  dateOfBirth: string;
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: EmergencyContactFields | null;
  role?: UserRole;
  canSeePrivate?: boolean;
  adminNotes?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
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

    if (normalized === "true" || normalized === "1") {
      return true;
    }

    if (normalized === "false" || normalized === "0" || normalized === "") {
      return false;
    }
  }

  return Boolean(value);
}

function normalizeUser(data: unknown): User {
  const d = data as Record<string, unknown>;
  const get = (key: string) => d[key];
  const canSeePrivateRaw =
    get("canSeePrivate") ?? get("can_see_private") ?? get("CanSeePrivate");
  const rawEmergencyContact =
    (get("emergencyContact") as EmergencyContactFields | string | null) ??
    (get("emergency_contact") as EmergencyContactFields | string | null) ??
    null;
  const emergencyFromRelation =
    rawEmergencyContact &&
    !(
      typeof rawEmergencyContact === "string" &&
      (rawEmergencyContact.trim() === "" ||
        rawEmergencyContact.trim().startsWith("/api/"))
    )
      ? parseEmergencyContact(rawEmergencyContact)
      : null;
  const emergencyFromFlat: EmergencyContactFields = {
    lastname: String(get("emergencyContactLastname") ?? "").trim(),
    firstname: String(get("emergencyContactFirstname") ?? "").trim(),
    email: String(get("emergencyContactEmail") ?? "").trim(),
    phone: String(get("emergencyContactPhone") ?? "").trim(),
  };
  const hasEmergencyFromFlat = Boolean(
    emergencyFromFlat.lastname ||
    emergencyFromFlat.firstname ||
    emergencyFromFlat.email ||
    emergencyFromFlat.phone,
  );
  const emergencyContact = hasEmergencyFromFlat
    ? emergencyFromFlat
    : emergencyFromRelation;

  return {
    id: Number(get("id") ?? 0),
    lastname: String(get("lastname") ?? ""),
    firstname: String(get("firstname") ?? ""),
    email: String(get("email") ?? ""),
    dateOfBirth: String(get("dateOfBirth") ?? ""),
    pseudo: (get("pseudo") as string) ?? null,
    phone: (get("phone") as string) ?? null,
    emergencyContact,
    role: (get("role") as UserRole) ?? "ROLE_USER",
    adminNotes: (get("adminNotes") as string) ?? null,
    canSeePrivate: toBoolean(canSeePrivateRaw ?? false),
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

    const violations = (data as { violations?: unknown }).violations;
    if (Array.isArray(violations) && violations.length > 0) {
      const firstViolation = violations[0] as {
        message?: unknown;
      };

      if (
        typeof firstViolation.message === "string" &&
        firstViolation.message.trim()
      ) {
        return firstViolation.message;
      }
    }
  }

  return "Une erreur est survenue.";
}

function normalizeSelfUserUpdateResult(data: unknown): SelfUserUpdateResult {
  const result = data as {
    user?: unknown;
    token?: unknown;
  };

  return {
    user: normalizeUser(result.user),
    token: String(result.token ?? ""),
  };
}

export async function getUsers(page?: number): Promise<UsersResult> {
  const headers = await getAuthHeaders();
  const url =
    page && page > 1
      ? buildUrl(`/api/users?page=${page}`)
      : buildUrl("/api/users");
  const response = await fetch(url, {
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

  const rawView = data["view"] as Record<string, string> | undefined;
  const view: CollectionView | undefined = rawView
    ? {
        first: rawView["first"],
        last: rawView["last"],
        next: rawView["next"],
        previous: rawView["previous"],
      }
    : undefined;

  return { users: items.map((item) => normalizeUser(item)), view };
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

export async function updateMyProfile(
  payload: UpdateMyProfilePayload,
): Promise<User> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(buildUrl("/api/me"), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }

  return normalizeUser(await response.json());
}

export async function updateMyEmail(
  payload: UpdateMyEmailPayload,
): Promise<SelfUserUpdateResult> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(buildUrl("/api/me/email"), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }

  return normalizeSelfUserUpdateResult(await response.json());
}

export async function updateMyPassword(
  payload: UpdateMyPasswordPayload,
): Promise<SelfUserUpdateResult> {
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(buildUrl("/api/me/password"), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }

  return normalizeSelfUserUpdateResult(await response.json());
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

export async function getCurrentUser(): Promise<User> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl("/api/me"), {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de charger l'utilisateur courant");
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
