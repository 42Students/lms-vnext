import type {AfterCollegeOutcome} from "./tpo-after-college-model";
import {
  getLearnerPlacementAccess,
  type ResolvedPlacementParticipation,
} from "./batch-eligibility-policy";
import { learnerPlacementDashboard } from "./learner-dashboard-model";

export const TPO_STUDENT_JOURNEY_STATES = [
  "NOT_REGISTERED",
  "NEEDS_READINESS_SUPPORT",
  "READY_NOT_APPLYING",
  "APPLYING",
  "PLACED",
] as const;

export type TpoStudentJourneyState =
  (typeof TPO_STUDENT_JOURNEY_STATES)[number];

export type TpoStudentApplicationSignal = {
  id: string;
  status: string;
  screeningStatus: string | null;
};

export type TpoStudentOfferSignal = {
  status: string;
  joiningStatus: string | null;
};

export type TpoStudentRoundSignal = {
  applicationId: string;
  sequence: number;
  kind: string;
  outcome: string;
};

export type TpoStudentSource = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  branchId: string;
  branchName: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  registrationChoice: string | null;
  participation: ResolvedPlacementParticipation;
  academicEvidence: {
    cgpaHundredths: number | null;
    activeBacklogs: number | null;
    pastBacklogs: number | null;
  };
  preferencesPresent: boolean;
  applications: readonly TpoStudentApplicationSignal[];
  offers: readonly TpoStudentOfferSignal[];
  appliedResults: readonly TpoStudentRoundSignal[];
  verifiedExternalOfferCount: number;
  ambiguousSection: boolean;
  afterCollegeOutcome?: AfterCollegeOutcome | null;
  afterCollegeUpdatedAt?: string | null;
};

export type TpoStudentReadinessSignal =
  | "PARTICIPATION_NOT_ELIGIBLE"
  | "ACADEMIC_EVIDENCE_MISSING"
  | "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT";

export type TpoStudentRow = {
  membershipId: string;
  displayName: string;
  email: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  branchId: string;
  branchName: string;
  programName: string;
  cohortId: string;
  cohortName: string;
  registrationChoice: string | null;
  registeredForPlacements: boolean;
  participationStatus: ResolvedPlacementParticipation["status"];
  readinessSignal: TpoStudentReadinessSignal;
  preferencesPresent: boolean;
  cgpa: number | null;
  activeBacklogs: number | null;
  pastBacklogs: number | null;
  applicationCount: number;
  activeApplicationCount: number;
  offerCount: number;
  acceptedOfferCount: number;
  verifiedExternalOfferCount: number;
  placed: boolean;
  journeyState: TpoStudentJourneyState;
  afterCollegeOutcome?: AfterCollegeOutcome | null;
  bestSoFar: string;
  maximumAppliedRoundSequence: number | null;
  ambiguousSection: boolean;
};

export type TpoStudentSummary = {
  activeLearners: number;
  placementPool: number;
  readyNotApplying: number;
  needsReadinessSupport: number;
  notRegistered: number;
  applying: number;
  placed: number;
  placedInPool: number;
  placedOutsidePool: number;
  readinessUnverified: true;
};

export type TpoStudentBranchSummary = TpoStudentSummary & {
  branchId: string;
  branchName: string;
  placementRatePercent: number | null;
};

export type TpoStudentRosterFilter = {
  journeyState?: TpoStudentJourneyState;
  afterCollege?: AfterCollegeOutcome;
  branchId?: string;
  search?: string;
  page: number;
  pageSize: number;
};

export type TpoStudentRosterPage = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: TpoStudentRow[];
};

/**
 * This is an evidence/participation signal, NOT a verified
 * employability or interview-readiness assessment.
 *
 * Job-specific eligibility still belongs to eligibility-service.
 */
export function deriveTpoStudent(
  source: TpoStudentSource,
  now: Date,
): TpoStudentRow {
  const registeredForPlacements =
    source.registrationChoice === "PLACEMENTS";

  const participationEligible =
    !source.ambiguousSection &&
    getLearnerPlacementAccess({
      collegeModuleEnabled: true,
      decision: source.participation,
      batchFinished: false,
    }).showPlacements;

  const academicEvidencePresent =
    source.academicEvidence.cgpaHundredths !== null &&
    source.academicEvidence.activeBacklogs !== null;

  const readinessSignal: TpoStudentReadinessSignal =
    !participationEligible
      ? "PARTICIPATION_NOT_ELIGIBLE"
      : !academicEvidencePresent
        ? "ACADEMIC_EVIDENCE_MISSING"
        : "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT";

  // Reuse the learner dashboard's definition of an active
  // submitted, non-rejected application.
  const dashboard = learnerPlacementDashboard(
    {
      jobs: [],
      rounds: [],
      offers: [],
      applications: source.applications.map((application) => ({
        applicationId: application.id,
        applicationStatus: application.status,
        screeningStatus:
          application.screeningStatus ?? "PENDING",
      })),
    },
    now,
  );

  const acceptedOfferCount = source.offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      offer.joiningStatus !== "DID_NOT_JOIN",
  ).length;

  const placed =
    acceptedOfferCount > 0 ||
    source.verifiedExternalOfferCount > 0;

  const offerCount = source.offers.filter(
    (offer) =>
      offer.status === "ISSUED" ||
      offer.status === "ACCEPTED",
  ).length;

  let journeyState: TpoStudentJourneyState;

  if (placed) {
    journeyState = "PLACED";
  } else if (!registeredForPlacements) {
    journeyState = "NOT_REGISTERED";
  } else if (dashboard.activeApplicationCount > 0) {
    journeyState = "APPLYING";
  } else if (
    readinessSignal !==
    "PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT"
  ) {
    journeyState = "NEEDS_READINESS_SUPPORT";
  } else {
    journeyState = "READY_NOT_APPLYING";
  }

  const maximumAppliedRoundSequence =
    source.appliedResults.length > 0
      ? Math.max(
          ...source.appliedResults.map(
            (result) => result.sequence,
          ),
        )
      : null;

  const latestDepth = [...source.appliedResults].sort(
    (a, b) =>
      b.sequence - a.sequence ||
      a.applicationId.localeCompare(b.applicationId),
  )[0];

  let bestSoFar = "Not applied";

  if (source.applications.length > 0) {
    bestSoFar = "Applied";
  }

  if (
    source.applications.some(
      (application) =>
        application.screeningStatus === "SHORTLISTED",
    )
  ) {
    bestSoFar = "Shortlisted";
  }

  if (latestDepth) {
    bestSoFar =
      `${latestDepth.kind.replaceAll("_", " ")} ` +
      `round ${latestDepth.sequence}: ${latestDepth.outcome}`;
  }

  if (offerCount > 0) {
    bestSoFar = "Offer issued";
  }

  if (placed) {
    bestSoFar = "Placed (provisional)";
  }

  return {
    membershipId: source.membershipId,
    displayName: source.displayName?.trim() || "Unnamed learner",
    email: source.email,
    rollNumber: source.rollNumber,
    registrationNumber: source.registrationNumber,
    branchId: source.branchId,
    branchName: source.branchName,
    programName: source.programName,
    cohortId: source.cohortId,
    cohortName: source.cohortName,
    registrationChoice: source.registrationChoice,
    registeredForPlacements,
    participationStatus: source.participation.status,
    readinessSignal,
    preferencesPresent: source.preferencesPresent,
    cgpa:
      source.academicEvidence.cgpaHundredths === null
        ? null
        : source.academicEvidence.cgpaHundredths / 100,
    activeBacklogs: source.academicEvidence.activeBacklogs,
    pastBacklogs: source.academicEvidence.pastBacklogs,
    applicationCount: source.applications.length,
    activeApplicationCount: dashboard.activeApplicationCount,
    offerCount,
    acceptedOfferCount,
    verifiedExternalOfferCount:
      source.verifiedExternalOfferCount,
    placed,
    journeyState,
    afterCollegeOutcome: source.afterCollegeOutcome ?? null,
    afterCollegeUpdatedAt: source.afterCollegeUpdatedAt ?? null,
    bestSoFar,
    maximumAppliedRoundSequence,
    ambiguousSection: source.ambiguousSection,
  };
}

export function summarizeTpoStudents(
  rows: readonly TpoStudentRow[],
): TpoStudentSummary {
  const placementPool = rows.filter(
    (row) => row.registeredForPlacements,
  ).length;

  const placedInPool = rows.filter(
    (row) => row.registeredForPlacements && row.placed,
  ).length;

  const placed = rows.filter(
    (row) => row.placed,
  ).length;

  return {
    activeLearners: rows.length,
    placementPool,
    readyNotApplying: rows.filter(
      (row) => row.journeyState === "READY_NOT_APPLYING",
    ).length,
    needsReadinessSupport: rows.filter(
      (row) =>
        row.journeyState === "NEEDS_READINESS_SUPPORT",
    ).length,
    notRegistered: rows.filter(
      (row) => row.journeyState === "NOT_REGISTERED",
    ).length,
    applying: rows.filter(
      (row) => row.journeyState === "APPLYING",
    ).length,
    placed,
    placedInPool,
    placedOutsidePool: placed - placedInPool,
    readinessUnverified: true,
  };
}

/**
 * Each learner contributes to exactly one academic branch.
 * The registered placement pool is the placement-rate
 * denominator, not all enrolled students.
 */
export function summarizeTpoStudentBranches(
  rows: readonly TpoStudentRow[],
): TpoStudentBranchSummary[] {
  const groups = new Map<
    string,
    {
      branchName: string;
      rows: TpoStudentRow[];
    }
  >();

  for (const row of rows) {
    const existing = groups.get(row.branchId) ?? {
      branchName: row.branchName,
      rows: [],
    };
    existing.rows.push(row);
    groups.set(row.branchId, existing);
  }

  return [...groups.entries()]
    .map(([branchId, group]) => {
      const summary = summarizeTpoStudents(group.rows);

      return {
        ...summary,
        branchId,
        branchName: group.branchName,
        placementRatePercent:
          summary.placementPool === 0
            ? null
            : Math.round(
                (summary.placedInPool /
                  summary.placementPool) *
                  10000,
              ) / 100,
      };
    })
    .sort(
      (a, b) =>
        a.branchName.localeCompare(b.branchName) ||
        a.branchId.localeCompare(b.branchId),
    );
}

/**
 * Totals are computed BEFORE these roster filters.
 * This ensures changing pages/search never alters
 * college-wide summary or branch intelligence.
 */
export function filterTpoStudentRoster(
  rows: readonly TpoStudentRow[],
  filter: TpoStudentRosterFilter,
): TpoStudentRosterPage {
  const search =
    filter.search?.trim().toLocaleLowerCase("en-IN") ?? "";

  const filtered = rows
    .filter(
      (row) =>
        !filter.journeyState ||
        row.journeyState === filter.journeyState,
    )
    .filter(
      (row) =>
        !filter.branchId ||
        row.branchId === filter.branchId,
    )
    .filter(row=>!filter.afterCollege ||
      (row.afterCollegeOutcome??"NOT_DECIDED")===filter.afterCollege)
    .filter((row) => {
      if (!search) return true;

      return [
        row.displayName,
        row.email,
        row.rollNumber,
        row.registrationNumber,
        row.branchName,
        row.cohortName,
      ].some((value) =>
        value
          ?.toLocaleLowerCase("en-IN")
          .includes(search),
      );
    })
    .sort(
      (a, b) =>
        a.displayName.localeCompare(b.displayName) ||
        a.membershipId.localeCompare(b.membershipId),
    );

  const offset = (filter.page - 1) * filter.pageSize;

  return {
    total: filtered.length,
    page: filter.page,
    pageSize: filter.pageSize,
    totalPages: Math.ceil(
      filtered.length / filter.pageSize,
    ),
    items: filtered.slice(
      offset,
      offset + filter.pageSize,
    ),
  };
}
