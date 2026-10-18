import { describe, expect, it } from "vitest";

import {
  resolvePlacementParticipation,
  type PlacementScopeDecision,
} from "@/modules/placements/batch-eligibility-policy";

import {
  deriveTpoStudent,
  filterTpoStudentRoster,
  summarizeTpoStudentBranches,
  summarizeTpoStudents,
  type TpoStudentSource,
} from "@/modules/placements/tpo-students-model";

const NOW = new Date("2026-10-14T10:00:00.000Z");

function decision(
  status: "ELIGIBLE" | "INELIGIBLE",
): PlacementScopeDecision {
  return {
    status,
    reason:
      status === "INELIGIBLE"
        ? "Placement participation not approved"
        : null,
    note: null,
    decidedAt: NOW,
  };
}

function source(
  id: string,
  changes: Partial<TpoStudentSource> = {},
): TpoStudentSource {
  return {
    membershipId: id,
    displayName: `Student ${id}`,
    email: `${id}@example.test`,
    rollNumber: `ROLL-${id}`,
    registrationNumber: null,
    branchId: "branch-cse",
    branchName: "Computer Science",
    programId: "program-btech",
    programName: "B.Tech",
    classIds: [],
    verification: { status: "UNKNOWN", waitingSections: [], verifiedSections: [] },
    cohortId: "cohort-2026",
    cohortName: "Batch 2026",
    registrationChoice: "PLACEMENTS",
    participation: resolvePlacementParticipation({
      learner: decision("ELIGIBLE"),
      section: null,
      cohort: null,
    }),
    academicEvidence: {
      cgpaHundredths: 875,
      activeBacklogs: 0,
      pastBacklogs: 1,
    },
    preferencesPresent: true,
    applications: [],
    offers: [],
    appliedResults: [],
    verifiedExternalOfferCount: 0,
    ambiguousSection: false,
    ...changes,
  };
}

describe("TPO Students journey derivation", () => {
  it("TPO-students-31 does not infer missing resume or projects from absent learner-owned profile data",()=>{
    const unknown=deriveTpoStudent(source("missing-profile",{profileDocument:null}),NOW);
    const empty=deriveTpoStudent(source("empty-profile",{profileDocument:{}}),NOW);
    const stored=deriveTpoStudent(source("saved-profile",{profileDocument:{
      resumeDocumentId:"verified-receipt",projects:[{title:"Self-reported"}],
    }}),NOW);
    expect(unknown.profileFacts).toBeUndefined();
    expect(empty.profileFacts).toMatchObject({resume:false,projects:0});
    expect(stored.profileFacts).toMatchObject({resume:true,projects:1});
    expect(unknown.journeyState).toBe("READY_NOT_APPLYING");
  });
  it("classifies a registered eligible learner with evidence and no applications as ready-not-applying", () => {
    const result = deriveTpoStudent(source("ready"), NOW);

    expect(result.journeyState).toBe("READY_NOT_APPLYING");
    expect(result.registeredForPlacements).toBe(true);
    expect(result.readinessSignal).toBe(
      "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT",
    );
    expect(result.cgpa).toBe(8.75);
    expect(result.bestSoFar).toBe("Not applied");
  });

  it("does not treat registration absence as placement readiness", () => {
    const result = deriveTpoStudent(
      source("unregistered", {
        registrationChoice: null,
      }),
      NOW,
    );

    expect(result.journeyState).toBe("NOT_REGISTERED");
    expect(result.registeredForPlacements).toBe(false);
  });

  it("keeps higher-studies registration outside the placement pool", () => {
    const result = deriveTpoStudent(
      source("higher-studies", {
        registrationChoice: "HIGHER_STUDIES",
      }),
      NOW,
    );

    expect(result.journeyState).toBe("NOT_REGISTERED");
  });

  it("reuses the eligibility hierarchy and recognizes missing academic evidence", () => {
    const learnerOverride = resolvePlacementParticipation({
      learner: decision("INELIGIBLE"),
      section: decision("ELIGIBLE"),
      cohort: decision("ELIGIBLE"),
    });

    const ineligible = deriveTpoStudent(
      source("ineligible", {
        participation: learnerOverride,
      }),
      NOW,
    );

    expect(ineligible.journeyState).toBe("NEEDS_READINESS_SUPPORT");
    expect(ineligible.readinessSignal).toBe(
      "PARTICIPATION_NOT_ELIGIBLE",
    );

    const missing = deriveTpoStudent(
      source("missing", {
        academicEvidence: {
          cgpaHundredths: null,
          activeBacklogs: null,
          pastBacklogs: null,
        },
      }),
      NOW,
    );

    expect(missing.journeyState).toBe("NEEDS_READINESS_SUPPORT");
    expect(missing.readinessSignal).toBe("ACADEMIC_EVIDENCE_MISSING");
  });

  it("uses the existing learner dashboard definition of an active application", () => {
    const result = deriveTpoStudent(
      source("applying", {
        applications: [
          {
            id: "app-active",
            status: "SUBMITTED",
            screeningStatus: "SHORTLISTED",
          },
          {
            id: "app-withdrawn",
            status: "WITHDRAWN",
            screeningStatus: "PENDING",
          },
          {
            id: "app-rejected",
            status: "SUBMITTED",
            screeningStatus: "REJECTED",
          },
        ],
      }),
      NOW,
    );

    expect(result.journeyState).toBe("APPLYING");
    expect(result.applicationCount).toBe(3);
    expect(result.activeApplicationCount).toBe(1);
    expect(result.bestSoFar).toBe("Shortlisted");
  });

  it("excludes staged results from the source contract and reports only applied depth", () => {
    const result = deriveTpoStudent(
      source("rounds", {
        applications: [
          {
            id: "app-1",
            status: "SUBMITTED",
            screeningStatus: "SHORTLISTED",
          },
        ],
        appliedResults: [
          {
            applicationId: "app-1",
            sequence: 1,
            kind: "TEST",
            outcome: "PASS",
          },
          {
            applicationId: "app-1",
            sequence: 2,
            kind: "INTERVIEW",
            outcome: "FAIL",
          },
        ],
      }),
      NOW,
    );

    expect(result.maximumAppliedRoundSequence).toBe(2);
    expect(result.bestSoFar).toBe("INTERVIEW round 2: FAIL");
  });

  it("recognizes an accepted offer but not an issued, declined or withdrawn offer as placed", () => {
    const accepted = deriveTpoStudent(
      source("accepted", {
        offers: [
          {
            status: "ISSUED",
            joiningStatus: null,
          },
          {
            status: "ACCEPTED",
            joiningStatus: "PENDING",
          },
        ],
      }),
      NOW,
    );

    expect(accepted.placed).toBe(true);
    expect(accepted.journeyState).toBe("PLACED");
    expect(accepted.acceptedOfferCount).toBe(1);

    const notPlaced = deriveTpoStudent(
      source("not-placed", {
        offers: [
          {
            status: "DECLINED",
            joiningStatus: null,
          },
          {
            status: "WITHDRAWN",
            joiningStatus: null,
          },
          {
            status: "ACCEPTED",
            joiningStatus: "DID_NOT_JOIN",
          },
        ],
      }),
      NOW,
    );

    expect(notPlaced.placed).toBe(false);
  });

  it("counts a verified external offer as placed, without requiring a synthetic job", () => {
    const result = deriveTpoStudent(
      source("external", {
        registrationChoice: null,
        verifiedExternalOfferCount: 1,
      }),
      NOW,
    );

    expect(result.placed).toBe(true);
    expect(result.journeyState).toBe("PLACED");
    expect(result.registeredForPlacements).toBe(false);
  });

  it("does not promote an ambiguous active section to readiness", () => {
    const result = deriveTpoStudent(
      source("ambiguous", {
        ambiguousSection: true,
      }),
      NOW,
    );

    expect(result.journeyState).toBe("NEEDS_READINESS_SUPPORT");
    expect(result.ambiguousSection).toBe(true);
  });
});

describe("TPO Students college and branch summaries", () => {
  const rows = [
    deriveTpoStudent(source("ready"), NOW),
    deriveTpoStudent(
      source("not-registered", {
        registrationChoice: null,
      }),
      NOW,
    ),
    deriveTpoStudent(
      source("placed", {
        offers: [
          {
            status: "ACCEPTED",
            joiningStatus: "JOINED",
          },
        ],
      }),
      NOW,
    ),
    deriveTpoStudent(
      source("external", {
        branchId: "branch-ece",
        branchName: "Electronics",
        registrationChoice: null,
        verifiedExternalOfferCount: 1,
      }),
      NOW,
    ),
    deriveTpoStudent(
      source("support", {
        branchId: "branch-ece",
        branchName: "Electronics",
        academicEvidence: {
          cgpaHundredths: null,
          activeBacklogs: null,
          pastBacklogs: null,
        },
      }),
      NOW,
    ),
  ];

  it("preserves one learner per row and keeps registered pool distinct from enrollment population", () => {
    const summary = summarizeTpoStudents(rows);

    expect(summary).toMatchObject({
      activeLearners: 5,
      placementPool: 3,
      readyNotApplying: 1,
      needsReadinessSupport: 1,
      notRegistered: 1,
      applying: 0,
      placed: 2,
      placedInPool: 1,
      placedOutsidePool: 1,
      readinessUnverified: true,
    });

    expect(
      summary.readyNotApplying +
        summary.needsReadinessSupport +
        summary.notRegistered +
        summary.applying +
        summary.placed,
    ).toBe(summary.activeLearners);
  });

  it("uses the registered placement pool as branch placement-rate denominator", () => {
    const branches = summarizeTpoStudentBranches(rows);

    expect(branches).toHaveLength(2);

    const cse = branches.find(
      (branch) => branch.branchId === "branch-cse",
    );

    const ece = branches.find(
      (branch) => branch.branchId === "branch-ece",
    );

    expect(cse).toMatchObject({
      activeLearners: 3,
      placementPool: 2,
      placedInPool: 1,
      placementRatePercent: 50,
    });

    expect(ece).toMatchObject({
      activeLearners: 2,
      placementPool: 1,
      placedInPool: 0,
      placedOutsidePool: 1,
      placementRatePercent: 0,
    });
  });

  it("paginates and filters without changing source rows", () => {
    const originalLength = rows.length;

    const page = filterTpoStudentRoster(rows, {
      journeyState: "PLACED",
      page: 1,
      pageSize: 1,
    });

    expect(page.total).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(rows).toHaveLength(originalLength);

    const secondPage = filterTpoStudentRoster(rows, {
      journeyState: "PLACED",
      page: 2,
      pageSize: 1,
    });

    expect(secondPage.items[0]?.membershipId).not.toBe(
      page.items[0]?.membershipId,
    );
  });

  it("supports branch and case-insensitive student search", () => {
    const result = filterTpoStudentRoster(rows, {
      branchId: "branch-ece",
      search: "STUDENT EXTERNAL",
      page: 1,
      pageSize: 25,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.membershipId).toBe("external");
  });

  it("returns empty pages beyond the filtered result without fabricating students", () => {
    const page = filterTpoStudentRoster(rows, {
      page: 500,
      pageSize: 25,
    });

    expect(page.total).toBe(rows.length);
    expect(page.items).toEqual([]);
  });
});
