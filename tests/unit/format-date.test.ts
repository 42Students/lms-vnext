import { describe, expect, it } from "vitest";
import { formatDateIst, formatDateTimeIst } from "@/lib/format-date";

describe("deterministic IST date formatting", () => {
  it("renders a fixed 12-hour en-IN string in Asia/Kolkata", () => {
    const text = formatDateTimeIst("2026-03-05T08:30:00.000Z");
    expect(text).toMatch(/^5 Mar 2026,? 2:00\s?pm$/i);
  });

  it("formats dates in Asia/Kolkata across the UTC day boundary", () => {
    expect(formatDateIst("2026-03-05T20:00:00.000Z")).toBe("6 Mar 2026");
  });
});
