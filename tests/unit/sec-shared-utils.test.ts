import { describe, expect, it } from "vitest";
import { clamp, first, humanize, isUniqueViolation } from "@/lib/shared";
import { currentTimeMs, fixedClock, installClock } from "@/lib/clock";

describe("shared helpers", () => {
  it("first takes the first search-param value", () => {
    expect(first(["a", "b"])).toBe("a");
    expect(first("a")).toBe("a");
    expect(first(undefined)).toBeUndefined();
    expect(first([])).toBeUndefined();
  });
  it("clamp bounds a number", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it("humanize turns enum values into labels", () => {
    expect(humanize("PENDING_REVIEW")).toBe("Pending Review");
    expect(humanize("offer")).toBe("Offer");
    expect(humanize("")).toBe("");
  });
  it("isUniqueViolation finds code 23505 on the error or anywhere in its cause chain", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "40001" })).toBe(false);
    expect(isUniqueViolation(new Error("x", { cause: { code: "23505" } }))).toBe(true);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("23505")).toBe(false);
    const loop: { cause?: unknown } = {};
    loop.cause = loop;
    expect(isUniqueViolation(loop)).toBe(false);
  });
  it("currentTimeMs follows the installed clock", () => {
    const restore = installClock(fixedClock(42));
    expect(currentTimeMs()).toBe(42);
    restore();
  });
});
