import {
  describe,
  expect,
  it,
} from "vitest";

import {
  adminModuleTraceHref,
  explainLearnerModuleAccess,
  MODULE_TRACE_LEVELS,
} from "@/modules/module-access/admin-trace-model";
import {
  getOptionalModuleSourceDefault,
  type ModuleAccessRule,
  type ModuleAccessScope,
} from "@/modules/module-access/service";

const ids = {
  membership: "00000000-0000-4000-8000-000000000001",
  section: "00000000-0000-4000-8000-000000000002",
  cohort: "00000000-0000-4000-8000-000000000003",
  program: "00000000-0000-4000-8000-000000000004",
  department: "00000000-0000-4000-8000-000000000005",
  college: "00000000-0000-4000-8000-000000000006",
  organization: "00000000-0000-4000-8000-000000000007",
};

const chain: ModuleAccessScope[] = [
  { scopeType: "MEMBERSHIP", scopeId: ids.membership },
  { scopeType: "SECTION", scopeId: ids.section },
  { scopeType: "COHORT", scopeId: ids.cohort },
  { scopeType: "PROGRAM", scopeId: ids.program },
  { scopeType: "DEPARTMENT", scopeId: ids.department },
  { scopeType: "COLLEGE", scopeId: ids.college },
  { scopeType: "ORGANIZATION", scopeId: ids.organization },
  { scopeType: "GLOBAL", scopeId: null },
];

function stored(
  scopeType: ModuleAccessRule["scopeType"],
  scopeId: string | null,
  module: ModuleAccessRule["module"],
  enabled: boolean,
  locked = false,
): ModuleAccessRule {
  return {
    scopeType,
    scopeId,
    module,
    enabled,
    locked,
  };
}

describe("Super Admin learner module access trace", () => {
  it("always includes the full scope order and source default", () => {
    const modules = explainLearnerModuleAccess(
      chain,
      [],
    );

    expect(modules).toHaveLength(3);

    for (const trace of modules) {
      expect(
        trace.steps.map((step) => step.level),
      ).toEqual(MODULE_TRACE_LEVELS);
    }

    expect(
      modules.map((module) => ({
        module: module.module,
        enabled: module.enabled,
        winnerLevel: module.winnerLevel,
      })),
    ).toEqual([
      {
        module: "projects",
        enabled: true,
        winnerLevel: "DEFAULT",
      },
      {
        module: "placements",
        enabled: false,
        winnerLevel: "DEFAULT",
      },
      {
        module: "electives",
        enabled: true,
        winnerLevel: "DEFAULT",
      },
    ]);

    expect(
      modules.every(
        (module) =>
          module.steps.filter(
            (step) => step.winner,
          ).length === 1,
      ),
    ).toBe(true);
  });

  it("marks the most-specific persisted rule as the winner without locks", () => {
    const modules = explainLearnerModuleAccess(
      chain,
      [
        stored(
          "COLLEGE",
          ids.college,
          "projects",
          false,
        ),
        stored(
          "SECTION",
          ids.section,
          "projects",
          true,
        ),
      ],
    );

    const projects = modules.find(
      (module) => module.module === "projects",
    )!;

    expect(projects).toMatchObject({
      enabled: true,
      winnerLevel: "SECTION",
      winnerLocked: false,
    });

    expect(
      projects.steps.find(
        (step) => step.level === "SECTION",
      ),
    ).toMatchObject({
      source: "PERSISTED",
      value: true,
      winner: true,
    });

    expect(
      projects.steps.find(
        (step) => step.level === "COLLEGE",
      ),
    ).toMatchObject({
      source: "PERSISTED",
      value: false,
      winner: false,
    });
  });

  it("explains a broader locked rule overriding a narrower member decision", () => {
    const projects = explainLearnerModuleAccess(
      chain,
      [
        stored(
          "MEMBERSHIP",
          ids.membership,
          "projects",
          true,
        ),
        stored(
          "ORGANIZATION",
          ids.organization,
          "projects",
          false,
          true,
        ),
      ],
    )[0];

    expect(projects).toMatchObject({
      enabled: false,
      winnerLevel: "ORGANIZATION",
      winnerLocked: true,
    });

    expect(
      projects.steps.find(
        (step) => step.level === "ORGANIZATION",
      ),
    ).toMatchObject({
      locked: true,
      winner: true,
      value: false,
    });

    expect(
      projects.steps.find(
        (step) => step.level === "MEMBERSHIP",
      )?.reason,
    ).toContain("locked rule");
  });

  it("uses the broadest lock when multiple stored rules are locked", () => {
    const result = explainLearnerModuleAccess(
      chain,
      [
        stored(
          "MEMBERSHIP",
          ids.membership,
          "electives",
          true,
          true,
        ),
        stored(
          "GLOBAL",
          null,
          "electives",
          false,
          true,
        ),
      ],
    );

    const electives = result.find(
      (module) => module.module === "electives",
    )!;

    expect(electives).toMatchObject({
      enabled: false,
      winnerLevel: "GLOBAL",
      winnerLocked: true,
    });

    expect(
      electives.steps.filter(
        (step) => step.winner,
      ).map((step) => step.level),
    ).toEqual(["GLOBAL"]);
  });

  it("shows ignored lower-level placement rules even when locked", () => {
    const placements = explainLearnerModuleAccess(
      chain,
      [
        stored(
          "MEMBERSHIP",
          ids.membership,
          "placements",
          false,
          true,
        ),
        stored(
          "COLLEGE",
          ids.college,
          "placements",
          true,
        ),
      ],
    ).find(
      (module) => module.module === "placements",
    )!;

    expect(placements).toMatchObject({
      enabled: true,
      winnerLevel: "COLLEGE",
    });

    expect(
      placements.steps.find(
        (step) => step.level === "MEMBERSHIP",
      ),
    ).toMatchObject({
      source: "PERSISTED",
      ignored: true,
      winner: false,
      locked: true,
    });
  });

  it("keeps absent current academic scopes visible without inventing a rule", () => {
    const partialChain: ModuleAccessScope[] = [
      { scopeType: "MEMBERSHIP", scopeId: ids.membership },
      { scopeType: "COLLEGE", scopeId: ids.college },
      {
        scopeType: "ORGANIZATION",
        scopeId: ids.organization,
      },
      { scopeType: "GLOBAL", scopeId: null },
    ];

    const projects = explainLearnerModuleAccess(
      partialChain,
      [],
    )[0];

    expect(
      projects.steps.find(
        (step) => step.level === "SECTION",
      ),
    ).toMatchObject({
      inChain: false,
      source: "NONE",
      winner: false,
      value: null,
    });

    expect(
      projects.steps.find(
        (step) => step.level === "DEPARTMENT",
      ),
    ).toMatchObject({
      inChain: false,
      source: "NONE",
    });
  });

  it("reads fallback values from the production module policy", () => {
    const modules = explainLearnerModuleAccess(
      chain,
      [],
    );

    for (const trace of modules) {
      const fallback = trace.steps.find(
        (step) => step.level === "DEFAULT",
      )!;

      expect(fallback.value).toBe(
        getOptionalModuleSourceDefault(
          trace.module,
        ),
      );
      expect(fallback.winner).toBe(true);
    }
  });

  it("does not mutate the chain or stored rules", () => {
    const rules = [
      stored(
        "COLLEGE",
        ids.college,
        "projects",
        false,
      ),
    ];

    const originalChain = chain.map(
      (scope) => ({ ...scope }),
    );
    const originalRules = rules.map(
      (rule) => ({ ...rule }),
    );

    explainLearnerModuleAccess(
      chain,
      rules,
    );

    expect(chain).toEqual(originalChain);
    expect(rules).toEqual(originalRules);
  });
});

describe("Super Admin learner trace URL", () => {
  it("uses the college-specific route by default", () => {
    expect(
      adminModuleTraceHref(ids.college),
    ).toBe(
      `/admin/features/${ids.college}/trace`,
    );
  });

  it("preserves search, pagination and membership selection without extra fields", () => {
    const path = adminModuleTraceHref(
      ids.college,
      {
        q: "  Rao & Sons  ",
        page: 4,
        membershipId: ids.membership,
      },
    );

    const url = new URL(
      path,
      "https://example.test",
    );

    expect(url.pathname).toBe(
      `/admin/features/${ids.college}/trace`,
    );

    expect(url.searchParams.get("q")).toBe(
      "Rao & Sons",
    );

    expect(url.searchParams.get("page")).toBe("4");
    expect(
      url.searchParams.get("membershipId"),
    ).toBe(ids.membership);

    expect(
      url.searchParams.has("email"),
    ).toBe(false);
  });
});


describe("students with stored module overrides links",()=>{
 it("preserves filtered mode in generated trace href",()=>{
  const href=adminModuleTraceHref("57b65bbc-7255-4d0d-a8de-6c85d3aa8df2",{overridesOnly:"only",q:"Asha",page:2});
  expect(href).toContain("overridesOnly=only");
  expect(href).toContain("page=2");
 });
});
