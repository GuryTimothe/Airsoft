/**
 * Response headers for every page the Next server returns.
 *
 * Kept here rather than inline in next.config.ts so the policy is reviewable
 * and testable in one place.
 *
 * Two CSP headers are sent on purpose. The enforced one carries only directives
 * that cannot break a working page: they forbid framing, plugins, and rewriting
 * the base or form targets. The restrictive policy ships as Report-Only, since
 * Next inlines its own bootstrap script and would need a nonce to run under a
 * strict script-src; violations show up in the browser console and in any
 * report collector, and the policy can be promoted to enforcing once it is
 * verified against the real pages.
 */

export interface SecurityHeader {
  key: string;
  value: string;
}

const ENFORCED_CSP = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

function reportOnlyCsp(isProduction: boolean): string {
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : // The dev server evaluates code for hot reloading.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function securityHeaders(isProduction: boolean): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
    { key: "Content-Security-Policy", value: ENFORCED_CSP },
    {
      key: "Content-Security-Policy-Report-Only",
      value: reportOnlyCsp(isProduction),
    },
  ];

  // Browsers ignore HSTS over plain HTTP, but sending it only in production
  // keeps a LAN-exposed dev server from pinning HTTPS on a developer's machine.
  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
