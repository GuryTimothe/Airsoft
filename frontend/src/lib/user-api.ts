import { getAuthHeaders, withCsrfHeaders } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { translateViolationMessage } from "@/lib/api-violations";
import {
  parseEmergencyContact,
  type EmergencyContactFields,
} from "@/lib/emergency-contact";

export type UserRole =
  "ROLE_USER" | "ROLE_ADMIN" | "ROLE_ORGANIZER" | "ROLE_SUPER_ADMIN";

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
  totalItems?: number;
}

export interface UpdateMyProfilePayload {
  lastname?: string;
  firstname?: string;
  dateOfBirth?: string;
  pseudo?: string | null;
  phone?: string | null;
  emergencyContact?: EmergencyContactFields | null;
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

export class ProfileValidationError extends Error {
  readonly messages: string[];

  constructor(messages: string[]) {
    super(messages[0] ?? "Une erreur est survenue.");
    this.name = "ProfileValidationError";
    this.messages = messages;
  }
}

const API_BASE_URL = getApiBaseUrl();

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

async function parseApiErrorMessage(
  response: Response,
  fallbackMessage = "Une erreur est survenue.",
  options?: { preferFallback?: boolean },
): Promise<string> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (options?.preferFallback) {
    return fallbackMessage;
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

  return fallbackMessage;
}

const PROFILE_FIELD_LABELS: Record<string, string> = {
  firstname: "Prenom",
  lastname: "Nom",
  dateOfBirth: "Date de naissance",
  pseudo: "Pseudo",
  phone: "Telephone",
  email: "Email",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe",
  password: "Mot de passe",
  emergencyContact: "Contact d'urgence",
  role: "Role",
};

async function parseProfileErrorMessages(
  response: Response,
  fallbackMessage = "Une erreur est survenue.",
): Promise<string[]> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    return [fallbackMessage];
  }

  if (typeof data !== "object" || data === null) {
    return [fallbackMessage];
  }

  const violations = (data as { violations?: unknown }).violations;
  if (Array.isArray(violations) && violations.length > 0) {
    return violations.map((violation) => {
      const v = violation as { propertyPath?: unknown; message?: unknown };
      const field =
        typeof v.propertyPath === "string"
          ? (PROFILE_FIELD_LABELS[v.propertyPath] ?? v.propertyPath)
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

  return [fallbackMessage];
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

export interface GetUsersFilters {
  role?: UserRole;
  canSeePrivate?: boolean;
  isMinor?: boolean;
  search?: string;
  searchBy?: "lastname" | "firstname";
}

export async function getUsers(
  page?: number,
  filters?: GetUsersFilters,
): Promise<UsersResult> {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();

  if (page && page > 1) {
    params.set("page", String(page));
  }

  if (filters?.role) {
    params.set("role", filters.role);
  }

  if (filters?.canSeePrivate !== undefined) {
    params.set("canSeePrivate", String(filters.canSeePrivate));
  }

  if (filters?.isMinor !== undefined) {
    params.set("isMinor", String(filters.isMinor));
  }

  if (filters?.search?.trim()) {
    params.set("search", filters.search.trim());
    if (filters.searchBy) {
      params.set("searchBy", filters.searchBy);
    }
  }

  const query = params.toString();
  const url = buildUrl(query ? `/api/users?${query}` : "/api/users");
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await parseApiErrorMessage(
        response,
        "Impossible de charger les utilisateurs",
        { preferFallback: true },
      ),
    );
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
    users: items.map((item) => normalizeUser(item)),
    view,
    totalItems: Number.isFinite(totalItems) ? totalItems : undefined,
  };
}

export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<User> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ProfileValidationError(await parseProfileErrorMessages(response));
  }

  return normalizeUser(await response.json());
}

export async function updateMyProfile(
  payload: UpdateMyProfilePayload,
): Promise<User> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/me"), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ProfileValidationError(await parseProfileErrorMessages(response));
  }

  return normalizeUser(await response.json());
}

export async function updateMyEmail(
  payload: UpdateMyEmailPayload,
): Promise<SelfUserUpdateResult> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/me/email"), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ProfileValidationError(await parseProfileErrorMessages(response));
  }

  return normalizeSelfUserUpdateResult(await response.json());
}

export async function updateMyPassword(
  payload: UpdateMyPasswordPayload,
): Promise<SelfUserUpdateResult> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/me/password"), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ProfileValidationError(await parseProfileErrorMessages(response));
  }

  return normalizeSelfUserUpdateResult(await response.json());
}

export async function getUser(id: number): Promise<User> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await parseApiErrorMessage(
        response,
        "Impossible de charger l'utilisateur",
        { preferFallback: true },
      ),
    );
  }

  return normalizeUser(await response.json());
}

export async function getCurrentUser(): Promise<User> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl("/api/me"), {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await parseApiErrorMessage(
        response,
        "Impossible de charger l'utilisateur courant",
        { preferFallback: true },
      ),
    );
  }

  return normalizeUser(await response.json());
}

export async function createUser(payload: CreateUserPayload): Promise<string> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/ld+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/users"), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ProfileValidationError(await parseProfileErrorMessages(response));
  }

  const data = (await response.json()) as { message?: unknown };

  return typeof data.message === "string"
    ? data.message
    : "Un e-mail de confirmation a été envoyé à l’utilisateur.";
}

export async function deleteCurrentUser(): Promise<void> {
  let headers = await getAuthHeaders();
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/me"), {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(await parseApiErrorMessage(response));
  }
}

export async function deleteUser(id: number): Promise<void> {
  let headers = await getAuthHeaders();
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl(`/api/users/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error("Impossible de supprimer l'utilisateur");
  }
}
