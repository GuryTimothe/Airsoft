import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  getRolesFromToken,
  getUserIdentifierFromToken,
  hasAdminAccessToken,
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
});
