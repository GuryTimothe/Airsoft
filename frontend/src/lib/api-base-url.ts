export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.INTERNAL_API_URL ?? "http://backend:8000";
  }

  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}
