import { describe, it, expect } from "@jest/globals";
import { formatWallClockDateTime } from "./date-time";

describe("formatWallClockDateTime", () => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  it("formats a standard ISO datetime string (wall-clock)", () => {
    const result = formatWallClockDateTime(
      "2026-07-15T20:00:00+00:00",
      options,
    );
    expect(result).toContain("2026");
    expect(result).toContain("20");
  });

  it("formats a datetime string without timezone (wall-clock, no conversion)", () => {
    const result = formatWallClockDateTime("2026-07-15 20:00:00", options);
    expect(result).toContain("2026");
  });

  it("formats a datetime string without seconds", () => {
    const result = formatWallClockDateTime("2026-07-15T20:30", options);
    expect(result).toContain("2026");
  });

  it("falls back to raw value for completely invalid input", () => {
    const result = formatWallClockDateTime("not-a-date", {});
    expect(result).toBe("not-a-date");
  });

  it("handles date-only string via fallback Date constructor", () => {
    const result = formatWallClockDateTime("2026-07-15", {
      year: "numeric",
      month: "long",
    });
    expect(result).toContain("2026");
  });
});
