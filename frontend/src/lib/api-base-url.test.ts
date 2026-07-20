import { describe, it, expect } from "@jest/globals";
import { getApiBaseUrl } from "@/lib/api-base-url";

describe("api-base-url", () => {
  it("uses NEXT_PUBLIC_API_URL in browser and normalizes trailing slash", () => {
    const previousPublic = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.org/";

    expect(getApiBaseUrl()).toBe("https://api.example.org");

    process.env.NEXT_PUBLIC_API_URL = previousPublic;
  });

  it("rewrites example.test URL to localhost when app runs on localhost", () => {
    const previousPublic = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test:8443";

    expect(getApiBaseUrl()).toBe("http://localhost:8000");

    process.env.NEXT_PUBLIC_API_URL = previousPublic;
  });

  it("returns localhost fallback when NEXT_PUBLIC_API_URL is malformed", () => {
    const previousPublic = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "://not-a-valid-url";

    expect(getApiBaseUrl()).toBe("http://localhost:8000");

    process.env.NEXT_PUBLIC_API_URL = previousPublic;
  });

  it("uses localhost fallback when NEXT_PUBLIC_API_URL is blank", () => {
    const previousPublic = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "  ";

    expect(getApiBaseUrl()).toBe("http://localhost:8000");

    process.env.NEXT_PUBLIC_API_URL = previousPublic;
  });
});
