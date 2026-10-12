import { describe, expect, it } from "vitest";
import {
  normalizeSkillSearchQuery,
  parseSkillCatalogQuery,
} from "@/modules/skills/catalog-validation";
import {
  canReadSkillCatalog,
} from "@/modules/skills/catalog-service";
import type { RequestContext } from "@/modules/identity/context";

const activeMember: RequestContext = {
  user: {
    id: "30000000-0000-4000-8000-000000000004",
    identityUid: "w06-skill-test",
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: "40000000-0000-4000-8000-000000000004",
    collegeId: "20000000-0000-4000-8000-000000000001",
    organizationId: "10000000-0000-4000-8000-000000000001",
    status: "ACTIVE",
    roles: ["LEARNER"],
  },
};

describe("DB10 shared skills reader scope", () => {
  it("accepts active college members, rejects inactive/suspended users", () => {
    expect(canReadSkillCatalog(activeMember)).toBe(true);
    expect(canReadSkillCatalog({
      ...activeMember,
      user: { ...activeMember.user, platformStatus: "SUSPENDED" },
    })).toBe(false);
    expect(canReadSkillCatalog({
      ...activeMember,
      membership: { ...activeMember.membership!, status: "SUSPENDED" },
    })).toBe(false);
    expect(canReadSkillCatalog({
      ...activeMember,
      membership: null,
    })).toBe(false);
  });

  it("allows explicitly active platform super admins without a college membership", () => {
    expect(canReadSkillCatalog({
      ...activeMember,
      user: { ...activeMember.user, systemRoles: ["SUPER_ADMIN"] },
      membership: null,
    })).toBe(true);
  });
});

describe("DB10 shared skills query validation", () => {
  it("defaults empty search to safe popular lookup", () => {
    expect(parseSkillCatalogQuery(new URLSearchParams()))
      .toEqual({ mode: "search", query: "", limit: 15 });
  });
  it("normalizes literal search text without translating SQL wildcard syntax", () => {
    expect(normalizeSkillSearchQuery("  C++  ")).toBe("c++");
    expect(normalizeSkillSearchQuery("  100%_  ")).toBe("100%_");
  });
  it("rejects invalid mode, oversized limits, large terms and missing category", () => {
    for (const value of [
      "mode=admin",
      "limit=1000",
      "limit=-1",
      "query=" + "a".repeat(81),
      "mode=category",
    ]) {
      expect(() => parseSkillCatalogQuery(new URLSearchParams(value))).toThrow();
    }
  });
  it("accepts explicit category and bounded result size", () => {
    const parsed = parseSkillCatalogQuery(new URLSearchParams(
      "mode=category&category=Technical+Skills&limit=25",
    ));
    expect(parsed).toEqual({
      mode: "category", query: "", category: "Technical Skills", limit: 25,
    });
  });
});
