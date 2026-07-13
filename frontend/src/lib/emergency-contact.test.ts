import { describe, it, expect } from "@jest/globals";
import { parseEmergencyContact } from "./emergency-contact";

describe("parseEmergencyContact", () => {
  it("returns empty contact for null input", () => {
    const result = parseEmergencyContact(null);
    expect(result).toEqual({
      lastname: "",
      firstname: "",
      email: "",
      phone: "",
    });
  });

  it("returns empty contact for undefined input", () => {
    const result = parseEmergencyContact(undefined);
    expect(result).toEqual({
      lastname: "",
      firstname: "",
      email: "",
      phone: "",
    });
  });

  it("returns empty contact for empty string", () => {
    const result = parseEmergencyContact("");
    expect(result).toEqual({
      lastname: "",
      firstname: "",
      email: "",
      phone: "",
    });
  });

  it("parses valid JSON string", () => {
    const raw = JSON.stringify({
      lastname: "Martin",
      firstname: "Paul",
      email: "paul@example.com",
      phone: "0612345678",
    });
    const result = parseEmergencyContact(raw);
    expect(result.lastname).toBe("Martin");
    expect(result.firstname).toBe("Paul");
    expect(result.email).toBe("paul@example.com");
    expect(result.phone).toBe("0612345678");
  });

  it("parses object input", () => {
    const result = parseEmergencyContact({
      lastname: "Dupont",
      firstname: "Alice",
      email: "alice@example.com",
      phone: "0600000001",
    });
    expect(result.lastname).toBe("Dupont");
    expect(result.firstname).toBe("Alice");
  });

  it("parses object with alternative key names", () => {
    const result = parseEmergencyContact({
      lastName: "Smith",
      firstName: "Bob",
      mail: "bob@example.com",
      telephone: "0600000002",
    } as never);
    expect(result.lastname).toBe("Smith");
    expect(result.firstname).toBe("Bob");
  });

  it("parses legacy dash-separated string", () => {
    const result = parseEmergencyContact("Martin - 0612345678");
    expect(result.lastname).toBe("Martin");
    expect(result.phone).toBe("0612345678");
    expect(result.firstname).toBe("");
  });

  it("parses single string without dash as lastname only", () => {
    const result = parseEmergencyContact("Martin");
    expect(result.lastname).toBe("Martin");
    expect(result.phone).toBe("");
  });

  it("handles invalid JSON string as legacy", () => {
    const result = parseEmergencyContact("{invalid json}");
    expect(result.lastname).toBe("{invalid json}");
  });

  it("handles whitespace-only string as empty", () => {
    const result = parseEmergencyContact("   ");
    expect(result).toEqual({
      lastname: "",
      firstname: "",
      email: "",
      phone: "",
    });
  });

  it("prioritizes specific key names over alternatives", () => {
    const result = parseEmergencyContact({
      lastname: "Primary", // Should use this
      lastName: "Secondary",
      firstname: "First", // Should use this
      firstName: "Second",
      email: "primary@example.com", // Should use this
      mail: "secondary@example.com",
      phone: "0611111111", // Should use this
      telephone: "0622222222",
    } as never);
    expect(result.lastname).toBe("Primary");
    expect(result.firstname).toBe("First");
    expect(result.email).toBe("primary@example.com");
    expect(result.phone).toBe("0611111111");
  });

  it("returns empty string when no matching keys found", () => {
    const result = parseEmergencyContact({
      wrong_key: "value",
      another_wrong: 123,
    } as never);
    expect(result.lastname).toBe("");
    expect(result.firstname).toBe("");
    expect(result.email).toBe("");
    expect(result.phone).toBe("");
  });
});
