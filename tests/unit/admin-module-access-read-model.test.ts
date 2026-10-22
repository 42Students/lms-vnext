import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ADMIN_MODULE_LABELS,
  adminFeaturesHref,
  describeModuleDecision,
  describeStoredOverride,
  resolveCollegeModuleDecisions,
} from "@/modules/module-access/admin-read-model";
import {
  type ModuleAccessRule,
  resolveModuleAccessFromRules,
} from "@/modules/module-access/service";

const COLLEGE_ID =
  "00000000-0000-4000-8000-000000000001";
const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000000002";

function rule(input: Partial<ModuleAccessRule> &
  Pick<ModuleAccessRule, "module">,
): ModuleAccessRule {
  return {
    scopeType: "COLLEGE",
    scopeId: COLLEGE_ID,
    enabled: true,
    locked: false,
    ...input,
  };
}

describe("Super Admin feature-control model", () => {
  it("uses the real source defaults when no persisted rule exists", () => {
    const decisions = resolveCollegeModuleDecisions(
      COLLEGE_ID,
      ORGANIZATION_ID,
      [],
    );

    expect(decisions.map((decision) => ({
      module: decision.module,
      enabled: decision.enabled,
      source: decision.source,
      level: decision.level,
    }))).toEqual([
      {
        module: "projects",
        enabled: true,
        source: "SOURCE_DEFAULT",
        level: "DEFAULT",
      },
      {
        module: "placements",
        enabled: false,
        source: "SOURCE_DEFAULT",
        level: "DEFAULT",
      },
    ]);
    // Electives is resolved internally, not exposed as a third legacy toggle.
    expect(resolveModuleAccessFromRules([{scopeType:"GLOBAL",scopeId:null}],[]).electives.enabled).toBe(true);
  });

  it("distinguishes college, organization and global persisted rules", () => {
    const decisions = resolveCollegeModuleDecisions(
      COLLEGE_ID,
      ORGANIZATION_ID,
      [
        rule({
          module: "projects",
          enabled: false,
        }),
        rule({
          scopeType: "ORGANIZATION",
          scopeId: ORGANIZATION_ID,
          module: "placements",
          enabled: true,
        }),
        rule({
          scopeType: "GLOBAL",
          scopeId: null,
          module: "electives",
          enabled: false,
        }),
      ],
    );

    expect(
      decisions.map((decision) => ({
        enabled: decision.enabled,
        source: decision.source,
        level: decision.level,
      })),
    ).toEqual([
      {
        enabled: false,
        source: "PERSISTED",
        level: "COLLEGE",
      },
      {
        enabled: true,
        source: "PERSISTED",
        level: "ORGANIZATION",
      },
    ]);
  });

  it("preserves the existing resolver's locked ancestor precedence", () => {
    const decisions = resolveCollegeModuleDecisions(
      COLLEGE_ID,
      ORGANIZATION_ID,
      [
        rule({
          module: "projects",
          enabled: true,
        }),
        rule({
          scopeType: "GLOBAL",
          scopeId: null,
          module: "projects",
          enabled: false,
          locked: true,
        }),
      ],
    );

    const projects = decisions.find(
      (decision) => decision.module === "projects",
    );

    expect(projects).toMatchObject({
      enabled: false,
      source: "PERSISTED",
      level: "GLOBAL",
      locked: true,
    });

    expect(
      describeModuleDecision(projects!),
    ).toBe("Persisted global rule · locked");
  });

  it("does not include another college's scoped override", () => {
    const otherCollegeId =
      "00000000-0000-4000-8000-000000000003";

    const decisions = resolveCollegeModuleDecisions(
      COLLEGE_ID,
      ORGANIZATION_ID,
      [
        rule({
          module: "placements",
          enabled: true,
          scopeId: otherCollegeId,
        }),
      ],
    );

    expect(
      decisions.find(
        (decision) =>
          decision.module === "placements",
      ),
    ).toMatchObject({
      enabled: false,
      source: "SOURCE_DEFAULT",
    });
  });

  it("resolves placements through the same hierarchy as other modules (lowest rule wins)", () => {
    const resolution = resolveModuleAccessFromRules(
      [
        {
          scopeType: "MEMBERSHIP",
          scopeId:
            "00000000-0000-4000-8000-000000000004",
        },
        {
          scopeType: "COLLEGE",
          scopeId: COLLEGE_ID,
        },
        {
          scopeType: "ORGANIZATION",
          scopeId: ORGANIZATION_ID,
        },
        {
          scopeType: "GLOBAL",
          scopeId: null,
        },
      ],
      [
        rule({
          scopeType: "MEMBERSHIP",
          scopeId:
            "00000000-0000-4000-8000-000000000004",
          module: "placements",
          enabled: true,
        }),
        rule({
          module: "placements",
          enabled: false,
        }),
      ],
    );

    // Legacy placements are switched at college scope; a personal access
    // rule cannot bypass a disabled college's placement module.
    expect(resolution.placements).toMatchObject({
      enabled: false,
      level: "COLLEGE",
    });
  });

  it("has labels and stored-rule display for each configured module", () => {
    expect(Object.keys(ADMIN_MODULE_LABELS)).toEqual([
      "projects",
      "placements",
      "electives",
    ]);

    expect(
      describeStoredOverride({
        enabled: true,
        locked: false,
      }),
    ).toBe("On");

    expect(
      describeStoredOverride({
        enabled: false,
        locked: true,
      }),
    ).toBe("Off · Locked");
  });
});

describe("Super Admin feature pagination URL", () => {
  it("uses the canonical route for default filters", () => {
    expect(
      adminFeaturesHref({}),
    ).toBe("/admin/features");

    expect(
      adminFeaturesHref({
        page: 1,
        q: "",
      }),
    ).toBe("/admin/features");
  });

  it("keeps search when changing page", () => {
    const url = new URL(
      adminFeaturesHref({
        q: "  Technical & Science  ",
        page: 3,
      }),
      "https://example.test",
    );

    expect(url.pathname).toBe(
      "/admin/features",
    );

    expect(url.searchParams.get("q")).toBe(
      "Technical & Science",
    );

    expect(url.searchParams.get("page")).toBe(
      "3",
    );

    expect(
      url.searchParams.has("collegeId"),
    ).toBe(false);
  });
});
