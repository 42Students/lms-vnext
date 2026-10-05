import { describe, expect, it } from "vitest";
import {
  resolveModuleAccessFromRules,
  type ModuleAccessScope,
} from "@/modules/module-access/service";

const chain: ModuleAccessScope[] = [
  { scopeType: "MEMBERSHIP", scopeId: "00000000-0000-0000-0000-000000000001" },
  { scopeType: "SECTION", scopeId: "00000000-0000-0000-0000-000000000002" },
  { scopeType: "COHORT", scopeId: "00000000-0000-0000-0000-000000000003" },
  { scopeType: "PROGRAM", scopeId: "00000000-0000-0000-0000-000000000004" },
  { scopeType: "DEPARTMENT", scopeId: "00000000-0000-0000-0000-000000000005" },
  { scopeType: "COLLEGE", scopeId: "00000000-0000-0000-0000-000000000006" },
  { scopeType: "ORGANIZATION", scopeId: "00000000-0000-0000-0000-000000000007" },
  { scopeType: "GLOBAL", scopeId: null },
];

describe("optional module access resolution", () => {
  it("uses product defaults when nothing is configured", () => {
    const result = resolveModuleAccessFromRules(chain, []);

    expect(result.projects.enabled).toBe(true);
    expect(result.electives.enabled).toBe(true);
    expect(result.placements.enabled).toBe(false);
    expect(result.placements.level).toBe("DEFAULT");
  });

  it("uses the most-specific Projects decision", () => {
    const result = resolveModuleAccessFromRules(chain, [
      {
        scopeType: "COLLEGE",
        scopeId: chain[5].scopeId,
        module: "projects",
        enabled: false,
        locked: false,
      },
      {
        scopeType: "SECTION",
        scopeId: chain[1].scopeId,
        module: "projects",
        enabled: true,
        locked: false,
      },
    ]);

    expect(result.projects).toMatchObject({
      enabled: true,
      level: "SECTION",
      locked: false,
    });
  });

  it("lets a broader locked Projects decision override narrower scopes", () => {
    const result = resolveModuleAccessFromRules(chain, [
      {
        scopeType: "ORGANIZATION",
        scopeId: chain[6].scopeId,
        module: "projects",
        enabled: false,
        locked: true,
      },
      {
        scopeType: "MEMBERSHIP",
        scopeId: chain[0].scopeId,
        module: "projects",
        enabled: true,
        locked: false,
      },
    ]);

    expect(result.projects).toMatchObject({
      enabled: false,
      level: "ORGANIZATION",
      locked: true,
    });
  });

  it("ignores below-college module rules for Placements", () => {
    const result = resolveModuleAccessFromRules(chain, [
      {
        scopeType: "MEMBERSHIP",
        scopeId: chain[0].scopeId,
        module: "placements",
        enabled: true,
        locked: true,
      },
      {
        scopeType: "COLLEGE",
        scopeId: chain[5].scopeId,
        module: "placements",
        enabled: true,
        locked: false,
      },
    ]);

    expect(result.placements).toMatchObject({
      enabled: true,
      level: "COLLEGE",
      locked: false,
    });
  });
});
