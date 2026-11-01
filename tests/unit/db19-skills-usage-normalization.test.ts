import { describe, expect, it } from "vitest";
import {
  normalizeSkillUsageKey,
  skillUsageNameSchema,
} from "@/modules/skills/usage-normalization";

describe("DB19-P30 legacy free-text skill usage key", () => {
  it("lowercases without merging leading/trailing spaces or catalog names", () => {
    expect(normalizeSkillUsageKey("Java")).toBe("java");
    expect(normalizeSkillUsageKey(" Java")).toBe(" java");
    expect(normalizeSkillUsageKey("Java ")).toBe("java ");
    expect(normalizeSkillUsageKey(" JAVA ")).toBe(" java ");
    expect(new Set(["Java", " Java", "Java "].map(normalizeSkillUsageKey)).size).toBe(3);
  });

  it("keeps case-insensitive identity for equal raw names", () => {
    expect(normalizeSkillUsageKey("Java")).toBe(normalizeSkillUsageKey("JAVA"));
  });

  it("rejects empty, whitespace-only, and oversized keys at this SQL-backed boundary", () => {
    for (const raw of ["", "  ", "\t", "x".repeat(201)]) {
      expect(skillUsageNameSchema.safeParse(raw).success).toBe(false);
      expect(() => normalizeSkillUsageKey(raw)).toThrow();
    }
    expect(skillUsageNameSchema.safeParse(" Java ").success).toBe(true);
    expect(skillUsageNameSchema.safeParse("x".repeat(200)).success).toBe(true);
  });
});
