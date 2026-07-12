import { getAuthHeaders } from "@/lib/auth";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
  const headers = await getAuthHeaders({
    "Content-Type": "application/merge-patch+json",
  });
  const response = await fetch(buildUrl("/api/app_settings"), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de mettre a jour les parametres");
  }

  return normalizeSettings(await response.json());
}
