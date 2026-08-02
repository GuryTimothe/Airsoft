function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function getBrowserFallbackUrl(): string {
  return normalizeBaseUrl(window.location.origin);
}

function isLocalBrowserHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function resolveBrowserApiBaseUrl(rawValue: string): string {
  const normalized = normalizeBaseUrl(rawValue);
  if (!normalized) {
    return getBrowserFallbackUrl();
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return getBrowserFallbackUrl();
  }

  const browserHost = window.location.hostname;
  if (
    isLocalBrowserHost(browserHost) &&
    parsed.hostname.endsWith(".example.test")
  ) {
    return getBrowserFallbackUrl();
  }

  return normalizeBaseUrl(parsed.toString());
}

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(
      process.env.INTERNAL_API_URL || "http://backend:8000",
    );
  }

  return resolveBrowserApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || "");
}
