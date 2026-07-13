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
  beforeEach(() => {
    localStorage.clear();
    document.cookie = `${AUTH_TOKEN_KEY}=; max-age=0`;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Token Management", () => {
    it("should store and retrieve token from localStorage", () => {
      const token = "test-jwt-token";
      setAuthToken(token);

      expect(getAuthToken()).toBe(token);
    });

    it("should clear auth token", () => {
      setAuthToken("test-token");
      clearAuthToken();

      expect(getAuthToken()).toBeNull();
      expect(isAuthenticated()).toBe(false);
    });

    it("should return null when no token exists", () => {
      expect(getAuthToken()).toBeNull();
    });

    it("should check if user is authenticated", () => {
      expect(isAuthenticated()).toBe(false);

      setAuthToken("test-token");
      expect(isAuthenticated()).toBe(true);

      clearAuthToken();
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
    it("should identify admin users correctly", () => {
      // JWT with ROLE_ADMIN
      const adminToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX0FETUlOIl19.signature";

      setAuthToken(adminToken);
      expect(hasAdminAccessToken()).toBe(true);
    });

    it("should identify super-admin users", () => {
      // JWT with ROLE_SUPER_ADMIN
      const superAdminToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX1NVUEVSX0FETUlOIl19.signature";

      setAuthToken(superAdminToken);
      expect(hasAdminAccessToken()).toBe(true);
    });

    it("should identify organizer users", () => {
      // JWT with ROLE_ORGANIZER
      const organizerToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX09SR0FOSVpFUiJdfQ.signature";

      setAuthToken(organizerToken);
      expect(hasAdminAccessToken()).toBe(true);
    });

    it("should deny access for regular users", () => {
      // JWT with only ROLE_USER
      const userToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJST0xFX1VTRVIiXX0.signature";

      setAuthToken(userToken);
      expect(hasAdminAccessToken()).toBe(false);
    });

    it("should return false when no token exists", () => {
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
    it("returns Authorization header when token exists", async () => {
      setAuthToken("my-jwt-token");
      const headers = await getAuthHeaders();
      expect((headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer my-jwt-token",
      );
    });

    it("returns empty headers when no token", async () => {
      clearAuthToken();
      const headers = await getAuthHeaders();
      expect(headers).not.toHaveProperty("Authorization");
    });

    it("merges with existing headers", async () => {
      setAuthToken("my-token");
      const headers = await getAuthHeaders({
        "Content-Type": "application/json",
      });
      expect((headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
      expect((headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer my-token",
      );
    });
  });

  describe("login()", () => {
    beforeEach(() => {
      clearAuthToken();
    });

    it("stores token on successful login", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "jwt-token-from-server" }),
      }) as jest.Mock;

      const token = await login({
        email: "user@example.com",
        password: "secret",
      });

      expect(token).toBe("jwt-token-from-server");
      expect(getAuthToken()).toBe("jwt-token-from-server");
    });

    it("throws on invalid credentials", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email ou mot de passe invalide." }),
      }) as jest.Mock;

      await expect(
        login({ email: "bad@example.com", password: "wrong" }),
      ).rejects.toThrow("Email ou mot de passe invalide.");
    });

    it("throws when token missing from response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: "no-token-here" }),
      }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).rejects.toThrow("token manquant");
    });

    it("throws with generic error when no message in response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "wrong" }),
      ).rejects.toThrow("invalide");
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
          password: "Password123",
          dateOfBirth: "1990-01-15",
        }),
      ).resolves.toBeUndefined();
    });

    it("throws on failed registration", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: "Email déjà utilisé." }),
      }) as jest.Mock;

      await expect(
        registerUser({
          firstname: "Jean",
          lastname: "Dupont",
          email: "existing@example.com",
          password: "Password123",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Email déjà utilisé.");
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
          password: "Password123",
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
          password: "Password123",
          dateOfBirth: "1990-01-15",
        }),
      ).rejects.toThrow("Impossible de créer le compte.");
    });
  });

  describe("login() - Additional error cases", () => {
    it("handles JSON parse error in login response", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).rejects.toThrow("Réponse de connexion invalide");
    });

    it("throws error when fetch fails on login", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));

      await expect(
        login({ email: "user@example.com", password: "secret" }),
      ).rejects.toThrow("Network error");
    });

    it("handles error response with message field", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Custom error message" }),
      }) as jest.Mock;

      await expect(
        login({ email: "user@example.com", password: "wrong" }),
      ).rejects.toThrow("Custom error message");
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
          password: "Password123",
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
