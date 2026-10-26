import { describe, it, expect } from "@jest/globals";
import { securityHeaders } from "@/lib/security-headers";

function headerValue(isProduction: boolean, key: string): string | undefined {
  return securityHeaders(isProduction).find((header) => header.key === key)
    ?.value;
}

describe("securityHeaders", () => {
  it("sets the headers that do not depend on the environment", () => {
    expect(headerValue(true, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(true, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(true, "Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headerValue(true, "Permissions-Policy")).toContain("camera=()");
  });

  it("enforces only the directives that cannot break a page", () => {
    const enforced = headerValue(true, "Content-Security-Policy") ?? "";

    expect(enforced).toContain("frame-ancestors 'none'");
    expect(enforced).toContain("object-src 'none'");
    // A script-src here would block Next's inlined bootstrap, so it belongs in
    // the Report-Only policy until a nonce is wired up.
    expect(enforced).not.toContain("script-src");
    expect(enforced).not.toContain("default-src");
  });

  it("reports the restrictive policy instead of enforcing it", () => {
    const reported =
      headerValue(true, "Content-Security-Policy-Report-Only") ?? "";

    expect(reported).toContain("default-src 'self'");
    expect(reported).toContain("script-src 'self' 'unsafe-inline'");
    expect(reported).toContain("connect-src 'self'");
  });

  it("allows eval only outside production, for hot reloading", () => {
    expect(headerValue(false, "Content-Security-Policy-Report-Only")).toContain(
      "'unsafe-eval'",
    );
    expect(
      headerValue(true, "Content-Security-Policy-Report-Only"),
    ).not.toContain("'unsafe-eval'");
  });

  it("sends HSTS in production only", () => {
    expect(headerValue(true, "Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(headerValue(false, "Strict-Transport-Security")).toBeUndefined();
  });
});
