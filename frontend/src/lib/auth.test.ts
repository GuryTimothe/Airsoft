import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  getRolesFromToken,
  getUserIdentifierFromToken,
  getUserIdentifierCandidatesFromToken,
  hasAdminAccessToken,
  getAuthHeaders,
  login,
  registerUser,
  AUTH_TOKEN_KEY,
} from "@/lib/auth";

describe("auth.ts - Authentication utilities", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
    document.cookie = `${AUTH_TOKEN_KEY}=; max-age=0`;
  });

  afterEach(() => {
    localStorage.clear();
    global.fetch = originalFetch;
  });

  describe("Token Management", () => {
    it("never exposes token to browser JavaScript", () => {
      setAuthToken("test-jwt-token");
      expect(getAuthToken()).toBeNull();
    });

    it("dispatches auth state change on setAuthToken", () => {
      const listener = jest.fn();
      window.addEventListener("auth-state-changed", listener);

      setAuthToken("test-token");

      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener("auth-state-changed", listener);
    });

    it("dispatches auth state change on clearAuthToken", () => {
      const listener = jest.fn();
      window.addEventListener("auth-state-changed", listener);

      clearAuthToken();

      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener("auth-state-changed", listener);
    });

    it("should return null when no token exists", () => {
      expect(getAuthToken()).toBeNull();
    });

    it("always reports unauthenticated in client code", () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe("JWT Parsing", () => {
    it("should extract roles from valid JWT", () => {
      // JWT with roles: ["ROLE_USER", "ROLE_ADMIN"]
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX1VTRVIiLCJST0xFX0FETUlOIl0sImlhdCI6MTUxNjIzOTAyMn0.signature";

      const roles = getRolesFromToken(token);
      expect(roles).toContain("ROLE_USER");
      expect(roles).toContain("ROLE_ADMIN");
    });

    it("should handle missing roles gracefully", () => {
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature";

      const roles = getRolesFromToken(token);
      expect(roles).toEqual([]);
    });

    it("should extract user identifier from JWT", () => {
      // JWT with email claim
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjJ9.signature";

      const identifier = getUserIdentifierFromToken(token);
      expect(identifier).toBe("user@example.com");
    });

    it("should return null for invalid JWT", () => {
      const roles = getRolesFromToken("invalid-token");
      expect(roles).toEqual([]);

      const identifier = getUserIdentifierFromToken("invalid-token");
      expect(identifier).toBeNull();
    });
  });

  describe("Admin Access Check", () => {
    it("returns false in browser context because token is not readable", () => {
      expect(hasAdminAccessToken()).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed JWT payloads", () => {
      // Invalid base64
      const malformed = "header.!!!invalid-base64!!!.signature";

      expect(() => getRolesFromToken(malformed)).not.toThrow();
      expect(getRolesFromToken(malformed)).toEqual([]);
    });

    it("should handle incomplete JWT structure", () => {
      const incomplete = "only-one-part";

      expect(getRolesFromToken(incomplete)).toEqual([]);
    });

    it("should trim whitespace from identifiers", () => {
      // JWT with email containing spaces (shouldn't happen but defensive)
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiAgdXNlckBleGFtcGxlLmNvbSAgIn0.signature";

      const identifier = getUserIdentifierFromToken(token);
      expect(identifier).toBe("user@example.com");
    });
  });

  describe("getUserIdentifierCandidatesFromToken", () => {
    it("returns candidates from username claim", () => {
      // JWT with username claim
      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXJAZXhhbXBsZS5jb20ifQ.sig";
      expect(getUserIdentifierCandidatesFromToken(token)).toContain(
        "user@example.com",
      );
    });

    it("returns empty array for null token", () => {
      expect(getUserIdentifierCandidatesFromToken(null)).toEqual([]);
    });

    it("returns empty array for invalid token", () => {
      expect(getUserIdentifierCandidatesFromToken("bad-token")).toEqual([]);
    });
  });

  describe("getAuthHeaders", () => {
    it("returns headers unchanged in browser context", async () => {
      const headers = await getAuthHeaders();
      expect(headers).toEqual({});
    });

    it("merges with existing headers", async () => {
      const headers = await getAuthHeaders({
        "Content-Type": "application/json",
      });
      expect((headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
      expect(
        (headers as Record<string, string>)["Authorization"],
      ).toBeUndefined();
    });
  });

  describe("login()", () => {
    beforeEach(() => {
      clearAuthToken();
    });

    it("performs csrf prefetch before login and returns empty string", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: "jwt-token-from-server" }),
        }) as jest.Mock;

      const token = await login({
        email: "user@example.com",
        password: "secret",
      });

      expect(token).toBe("");
      expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
        "/api/csrf/token",
      );
      expect((global.fetch as jest.Mock).mock.calls[1][0]).toContain(
        "/api/login",
      );
    });

    it("throws on invalid credentials", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Email ou mot de passe invalide." }),
        }) as jest.Mock;

      await expect(
        login({ email: "bad@example.com", password: "wrong" }),
      ).rejects.toThrow("Identifiants invalides.");
    });

    it("throws when csrf prefetch fails", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ csrfToken: "" }),
      }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).rejects.toThrow("Impossible d'initialiser la session.");
    });

    it("throws with generic error when no message in response", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({}),
        }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "wrong" }),
      ).rejects.toThrow("Identifiants invalides.");
    });
  });

  describe("registerUser()", () => {
    it("resolves on successful registration", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "jean@example.com",
          password: "Password1234!",
          dateOfBirth: "1990-01-15",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws on failed registration", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Identifiants invalides." }),
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "existing@example.com",
          password: "Password1234!",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Identifiants invalides.");
    });

    it("throws generic error when no detail in response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "jean@example.com",
          password: "Password1234!",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Impossible de créer le compte.");
    });

    it("handles JSON parse error in registration response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "jean@example.com",
          password: "Password1234!",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Impossible de créer le compte.");
    });
  });

  describe("login() - Additional error cases", () => {
    it("handles JSON parse error in login response", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new Error("Invalid JSON");
          },
        }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).resolves.toBe("");
    });

    it("throws error when fetch fails on login", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).rejects.toThrow("Network error");
    });

    it("handles error response with message field", async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ csrfToken: "csrf-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Custom error message" }),
        }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "wrong" }),
      ).rejects.toThrow("Identifiants invalides.");
    });
  });

  describe("registerUser() - Additional error cases", () => {
    it("throws error when fetch fails on registration", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "jean@example.com",
          password: "Password1234!",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Network error");
    });

    it("handles error response with message field in registration", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Custom error message" }),
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "jean@example.com",
          password: "Password123",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Impossible de créer le compte.");
    });
  });
});
