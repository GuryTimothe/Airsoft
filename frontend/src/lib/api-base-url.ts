function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function isPlaceholderHost(value: string): boolean {
  return /(^|\.)example\.(test|com)(:\d+)?$/i.test(value);
}

function isLocalDevBrowserHost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1";
}

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const internal = process.env.INTERNAL_API_URL;
    return normalizeBaseUrl(
      internal && internal.trim() ? internal : "http://backend:8000",
    );
  }

  const configured = process.env.NEXT_PUBLIC_API_URL;
  const normalized = normalizeBaseUrl(
    configured && configured.trim() ? configured : "http://localhost:8000",
  );

  try {
    const parsed = new URL(normalized);
    if (isPlaceholderHost(parsed.hostname) && isLocalDevBrowserHost()) {
      return "http://localhost:8000";
    }
  } catch {
    return "http://localhost:8000";
  }

  return normalized;
}
