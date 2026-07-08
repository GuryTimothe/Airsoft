import { getAuthHeaders } from "@/lib/auth";
import {
  parseEmergencyContact,
  type EmergencyContactFields,
} from "@/lib/emergency-contact";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function buildUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export async function getEmergencyContactByUserId(
  userId: number,
): Promise<EmergencyContactFields | null> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    buildUrl(`/api/emergency_contacts?user.id=${userId}`),
    {
      cache: "no-store",
      headers,
    },
  );

  if (!response.ok) {
    throw new Error("Impossible de charger le contact d'urgence");
  }

  const data = (await response.json()) as Record<string, unknown>;
  const items = Array.isArray(data["hydra:member"])
    ? (data["hydra:member"] as unknown[])
    : Array.isArray(data["member"])
      ? (data["member"] as unknown[])
      : Array.isArray(data["items"])
        ? (data["items"] as unknown[])
        : Array.isArray(data)
          ? (data as unknown[])
          : [];

  if (items.length === 0) {
    return null;
  }

  return parseEmergencyContact(items[0] as Record<string, unknown>);
}
