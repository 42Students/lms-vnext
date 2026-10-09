import { describe, expect, it } from "vitest";
import type { ModuleAccessScope } from "@/modules/module-access/service";
import { resolvePlacementParticipationFromDecisions } from "@/modules/placements/access-service";

const chain: ModuleAccessScope[] = [
  { scopeType: "MEMBERSHIP", scopeId: "00000000-0000-0000-0000-000000000001" },
  { scopeType: "SECTION", scopeId: "00000000-0000-0000-0000-000000000002" },
  { scopeType: "COHORT", scopeId: "00000000-0000-0000-0000-000000000003" },
  { scopeType: "COLLEGE", scopeId: "00000000-0000-0000-0000-000000000004" },
  { scopeType: "GLOBAL", scopeId: null },
];

describe("learner placement participation", () => {
  it("defaults to not decided", () => {
    expect(
      resolvePlacementParticipationFromDecisions(chain, []),
    ).toEqual({
      status: "NOT_DECIDED",
      level: null,
      reason: null,
      note: null,
    });
  });

  it("uses membership before section and cohort", () => {
    const result =
      resolvePlacementParticipationFromDecisions(
        chain,
        [
          {
            scopeType: "COHORT",
            scopeId: chain[2].scopeId!,
            status: "ELIGIBLE",
            reason: null,
            note: null,
          },
          {
            scopeType: "SECTION",
            scopeId: chain[1].scopeId!,
            status: "ELIGIBLE",
            reason: null,
            note: null,
          },
          {
            scopeType: "MEMBERSHIP",
            scopeId: chain[0].scopeId!,
            status: "INELIGIBLE",
            reason: "Placement cell decision",
            note: null,
          },
        ],
      );

    expect(result).toEqual({
      status: "INELIGIBLE",
      level: "MEMBERSHIP",
      reason: "Placement cell decision",
      note: null,
    });
  });
  it("enforces V188 precedence even when the caller supplies scopes out of order", () => {
    const decisions = [
      {
        scopeType: "COHORT",
        scopeId: chain[2].scopeId!,
        status: "INELIGIBLE",
        reason: "Batch excluded",
        note: null,
      },
      {
        scopeType: "SECTION",
        scopeId: chain[1].scopeId!,
        status: "ELIGIBLE",
        reason: null,
        note: "Class included",
      },
      {
        scopeType: "MEMBERSHIP",
        scopeId: chain[0].scopeId!,
        status: "INELIGIBLE",
        reason: "Learner debarred",
        note: "Manual decision",
      },
    ];
    const result = resolvePlacementParticipationFromDecisions(
      [...chain].reverse(),
      decisions,
    );
    expect(result).toEqual({
      status: "INELIGIBLE",
      level: "MEMBERSHIP",
      reason: "Learner debarred",
      note: "Manual decision",
    });
  });

  it("falls back from undecided learner to section, then cohort", () => {
    const decisions = [
      {
        scopeType: "COHORT",
        scopeId: chain[2].scopeId!,
        status: "INELIGIBLE",
        reason: "Batch excluded",
        note: null,
      },
      {
        scopeType: "SECTION",
        scopeId: chain[1].scopeId!,
        status: "ELIGIBLE",
        reason: null,
        note: null,
      },
    ];
    expect(
      resolvePlacementParticipationFromDecisions(
        [...chain].reverse(),
        decisions,
      ),
    ).toMatchObject({ status: "ELIGIBLE", level: "SECTION" });

    expect(
      resolvePlacementParticipationFromDecisions(
        [...chain].reverse(),
        decisions.filter((item) => item.scopeType !== "SECTION"),
      ),
    ).toMatchObject({ status: "INELIGIBLE", level: "COHORT" });
  });

  it("keeps missing and invalid decisions as NOT_DECIDED", () => {
    expect(
      resolvePlacementParticipationFromDecisions(chain, [
        {
          scopeType: "GLOBAL",
          scopeId: chain[4].scopeId ?? "",
          status: "ELIGIBLE",
          reason: null,
          note: null,
        },
        {
          scopeType: "COHORT",
          scopeId: chain[2].scopeId!,
          status: "NOT_DECIDED",
          reason: null,
          note: null,
        },
      ]),
    ).toEqual({
      status: "NOT_DECIDED",
      level: null,
      reason: null,
      note: null,
    });
  });
});
