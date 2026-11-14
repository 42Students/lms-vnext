import { describe, expect, it } from "vitest";
import { PAGE_SIZES } from "@/lib/pagination";
import { zUuid } from "@/lib/schema-primitives";

describe("pagination and schema primitives", () => {
  it("page sizes are whole positive numbers in increasing order and frozen", () => {
    const values = Object.values(PAGE_SIZES);
    expect(values.every((n) => Number.isInteger(n) && n > 0)).toBe(true);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(Object.isFrozen(PAGE_SIZES)).toBe(true);
  });
  it("zUuid accepts canonical ids and nothing else", () => {
    expect(zUuid.safeParse("20000000-0000-4000-8000-000000000001").success).toBe(true);
    for (const bad of ["", "abc", "20000000000040008000000000000001", "20000000-0000-4000-8000-00000000000g", 7, null]) {
      expect(zUuid.safeParse(bad).success, String(bad)).toBe(false);
    }
  });
});
