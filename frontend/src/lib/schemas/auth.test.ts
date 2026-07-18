import { describe, it, expect } from "@jest/globals";
import { loginSchema, registerSchema, guardianSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      loginSchema.safeParse({ email: "user@example.com", password: "secret" })
        .success,
    ).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validAdult = {
    lastname: "Dupont",
    firstname: "Jean",
    email: "jean@example.com",
    password: "Password1234!",
    confirm: "Password1234!",
    dateOfBirth: "1990-01-15",
  };

  it("accepts valid adult registration", () => {
    expect(registerSchema.safeParse(validAdult).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      confirm: "DifferentPassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirm");
    }
  });

  it("rejects future date of birth", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      dateOfBirth: "2090-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date of birth", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      dateOfBirth: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      password: "123",
      confirm: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short firstname", () => {
    const result = registerSchema.safeParse({ ...validAdult, firstname: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects missing guardian for minor", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      dateOfBirth: "2015-06-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths.some((p) => p.startsWith("guardian"))).toBe(true);
    }
  });

  it("accepts minor with complete guardian info", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      dateOfBirth: "2015-06-01",
      guardianLastname: "Martin",
      guardianFirstname: "Paul",
      guardianEmail: "paul@example.com",
      guardianPhone: "0612345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects minor with invalid guardian email", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      dateOfBirth: "2015-06-01",
      guardianLastname: "Martin",
      guardianFirstname: "Paul",
      guardianEmail: "not-an-email",
      guardianPhone: "0612345678",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional pseudo and phone", () => {
    const result = registerSchema.safeParse({
      ...validAdult,
      pseudo: "SniperFox",
      phone: "0612345678",
    });
    expect(result.success).toBe(true);
  });
});

describe("guardianSchema", () => {
  const validGuardian = {
    guardianLastname: "Martin",
    guardianFirstname: "Paul",
    guardianEmail: "paul@example.com",
    guardianPhone: "0612",
    guardianConsent: true,
  };

  it("accepts valid guardian data", () => {
    expect(guardianSchema.safeParse(validGuardian).success).toBe(true);
  });

  it("rejects when consent is false", () => {
    const result = guardianSchema.safeParse({
      ...validGuardian,
      guardianConsent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid guardian email", () => {
    const result = guardianSchema.safeParse({
      ...validGuardian,
      guardianEmail: "bad-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing lastname", () => {
    const result = guardianSchema.safeParse({
      ...validGuardian,
      guardianLastname: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("Age calculation edge cases", () => {
  const baseAdult = {
    lastname: "Dupont",
    firstname: "Jean",
    email: "jean@example.com",
    password: "Password1234!",
    confirm: "Password1234!",
  };

  it("correctly identifies person as 17 years old (still minor)", () => {
    const today = new Date();
    const seventeenYearsAgo = new Date(
      today.getFullYear() - 17,
      today.getMonth(),
      today.getDate(),
    );
    const result = registerSchema.safeParse({
      ...baseAdult,
      dateOfBirth: seventeenYearsAgo.toISOString().split("T")[0],
      guardianLastname: "Parent",
      guardianFirstname: "John",
      guardianEmail: "parent@example.com",
      guardianPhone: "0612",
    });
    expect(result.success).toBe(true);
  });

  it("correctly identifies person turning 18 this year after birthday passed", () => {
    const today = new Date();
    // Create a date 18 years ago + 1 day (so birthday already passed this year)
    const pastBirthdayDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      Math.max(1, today.getDate() - 1),
    );
    const result = registerSchema.safeParse({
      ...baseAdult,
      dateOfBirth: pastBirthdayDate.toISOString().split("T")[0],
    });
    expect(result.success).toBe(true);
  });

  it("requires guardian for person born same month, later day this year", () => {
    const today = new Date();
    const laterDayInMonth = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate() + 5,
    );
    const dobStr = laterDayInMonth.toISOString().split("T")[0];
    const result = registerSchema.safeParse({
      ...baseAdult,
      dateOfBirth: dobStr,
    });
    expect(result.success).toBe(false);
  });

  it("accepts adult registration without guardian info", () => {
    const today = new Date();
    const adultsAgo = new Date(
      today.getFullYear() - 25,
      today.getMonth(),
      today.getDate(),
    );
    const result = registerSchema.safeParse({
      ...baseAdult,
      dateOfBirth: adultsAgo.toISOString().split("T")[0],
    });
    expect(result.success).toBe(true);
  });
});
