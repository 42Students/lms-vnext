import { describe, expect, it, vi } from "vitest";
import { createMemoryLimiter } from "@/security/memory-limiter";

describe("write-budget memory limiter", () => {
  it("allows up to the limit in a window, then refuses, then resets", () => {
    const allow = createMemoryLimiter({ maxKeys: 10 });
    expect([1, 2, 3].map(() => allow("k", 3, 1000, 0))).toEqual([true, true, true]);
    expect(allow("k", 3, 1000, 10)).toBe(false);
    expect(allow("k", 3, 1000, 1001)).toBe(true);
  });
  it("fails open for new keys when full, and says so, but keeps counting known keys", () => {
    const onSaturated = vi.fn();
    const allow = createMemoryLimiter({ maxKeys: 2, onSaturated });
    allow("a", 1, 1000, 0); allow("b", 1, 1000, 0);
    expect(allow("c", 1, 1000, 1)).toBe(true);
    expect(onSaturated).toHaveBeenCalled();
    expect(allow("a", 1, 1000, 2)).toBe(false);
  });
  it("reclaims expired windows before giving up", () => {
    const allow = createMemoryLimiter({ maxKeys: 2 });
    allow("a", 1, 1000, 0); allow("b", 1, 1000, 0);
    expect(allow("c", 1, 1000, 5000)).toBe(true);
    expect(allow("c", 1, 1000, 5001)).toBe(false);
  });
});
