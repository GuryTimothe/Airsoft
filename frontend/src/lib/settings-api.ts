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

function normalizeSettings(data: unknown): AppSetting {
  const d = data as Record<string, unknown>;
  const get = (key: string) => d[key];

  return {
    id: Number(get("id") ?? 0),
    defaultAddress: String(
      get("defaultAddress") ?? get("default_address") ?? "Terrain principal",
    ),
    defaultPrice: Number(get("defaultPrice") ?? get("default_price") ?? 10),
    defaultMaxPlaces: Number(
      get("defaultMaxPlaces") ?? get("default_max_places") ?? 24,
    ),
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
  const response = await fetch(buildUrl("/api/app_settings"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de charger les parametres");
  }

  const data = await response.json();
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (Array.isArray(data["hydra:member"])) {
    items = data["hydra:member"];
  } else if (Array.isArray(data["member"])) {
    items = data["member"];
  }

  if (items.length === 0) {
    return null;
  }

  return normalizeSettings(items[0]);
}

export async function createAppSettings(
  payload: AppSettingPayload,
): Promise<AppSetting> {
  const response = await fetch(buildUrl("/api/app_settings"), {
    method: "POST",
    headers: {
      "Content-Type": "application/ld+json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de creer les parametres");
  }

  return normalizeSettings(await response.json());
}

export async function updateAppSettings(
  id: number,
  payload: AppSettingPayload,
): Promise<AppSetting> {
  const response = await fetch(buildUrl(`/api/app_settings/${id}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/merge-patch+json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Impossible de mettre a jour les parametres");
  }

  return normalizeSettings(await response.json());
}
