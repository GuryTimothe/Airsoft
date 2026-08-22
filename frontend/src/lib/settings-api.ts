import { getAuthHeaders, withCsrfHeaders } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-base-url";
import { translateViolationMessage } from "@/lib/api-violations";

export interface AppSetting {
  id: number;
  defaultAddress: string;
  defaultPrice: number;
  defaultMaxPlaces: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSettingPayload {
  defaultAddress: string;
  defaultPrice: number;
  defaultMaxPlaces: number;
}

export class AppSettingsValidationError extends Error {
  readonly messages: string[];

  constructor(messages: string[]) {
    super(messages[0] ?? "Impossible de mettre a jour les parametres.");
    this.name = "AppSettingsValidationError";
    this.messages = messages;
  }
}

const FIELD_LABELS: Record<string, string> = {
  defaultAddress: "Lieu par defaut",
  defaultPrice: "PAF par defaut",
  defaultMaxPlaces: "Nombre de joueurs par defaut",
};

async function parseSettingsErrorMessages(
  response: Response,
): Promise<string[]> {
  const fallback = "Impossible de mettre a jour les parametres.";
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    return [fallback];
  }

  const root = asRecord(data);
  if (!root) {
    return [fallback];
  }

  const violations = root["violations"];
  if (Array.isArray(violations) && violations.length > 0) {
    return violations.map((violation) => {
      const v = violation as { propertyPath?: unknown; message?: unknown };
      const field =
        typeof v.propertyPath === "string"
          ? (FIELD_LABELS[v.propertyPath] ?? v.propertyPath)
          : null;
      const message =
        typeof v.message === "string"
          ? translateViolationMessage(v.message)
          : "valeur invalide.";

      return field ? `${field} : ${message}` : message;
    });
  }

  const detail = root["detail"];
  if (typeof detail === "string" && detail.trim()) {
    return [translateViolationMessage(detail)];
  }

  const message = root["message"];
  if (typeof message === "string" && message.trim()) {
    return [translateViolationMessage(message)];
  }

  return [fallback];
}

const API_BASE_URL = getApiBaseUrl();

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }

  return data as Record<string, unknown>;
}

function firstHydraMember(data: unknown): Record<string, unknown> | null {
  const root = asRecord(data);
  if (!root) {
    return null;
  }

  const member = root["hydra:member"];
  if (!Array.isArray(member) || member.length === 0) {
    return root;
  }

  return asRecord(member[0]);
}

function normalizeSettings(data: unknown): AppSetting {
  const d = firstHydraMember(data);
  if (!d) {
    throw new Error("Format de reponse invalide pour les parametres");
  }

  const get = (key: string) => d[key];

  const defaultAddressRaw = get("defaultAddress") ?? get("default_address");
  const defaultPriceRaw = get("defaultPrice") ?? get("default_price");
  const defaultMaxPlacesRaw =
    get("defaultMaxPlaces") ?? get("default_max_places");

  const defaultAddress =
    typeof defaultAddressRaw === "string" ? defaultAddressRaw : null;
  const defaultPrice = Number(defaultPriceRaw);
  const defaultMaxPlaces = Number(defaultMaxPlacesRaw);

  if (
    !defaultAddress ||
    !Number.isFinite(defaultPrice) ||
    !Number.isFinite(defaultMaxPlaces)
  ) {
    throw new Error("Parametres recus incomplets ou invalides");
  }

  return {
    id: Number(get("id") ?? 0),
    defaultAddress,
    defaultPrice,
    defaultMaxPlaces,
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

export async function getAppSettings(): Promise<AppSetting | null> {
  const headers = await getAuthHeaders();
  const response = await fetch(buildUrl("/api/app_settings"), {
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de charger les parametres");
  }

  const data = await response.json();
  if (null === data) {
    return null;
  }

  return normalizeSettings(data);
}

export async function updateAppSettings(
  payload: AppSettingPayload,
): Promise<AppSetting> {
  let headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  headers = await withCsrfHeaders(headers);
  const response = await fetch(buildUrl("/api/app_settings"), {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new AppSettingsValidationError(
      await parseSettingsErrorMessages(response),
    );
  }

  return normalizeSettings(await response.json());
}
