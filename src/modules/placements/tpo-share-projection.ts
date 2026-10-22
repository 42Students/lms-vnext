/**
 * DB09 share projection: one privacy contract for recruiter links and the
 * learner's "what companies see" preview. Not connected to public routes
 * until token/grant/tenant and database migrations are implemented.
 *
 * Legacy oracle: TpoShareService.rowsFor (prod-2026).
 * Intentional privacy tightening: unknown application stages fail closed;
 * optional screening score is gated by the persisted college toggle.
 */
export const TPO_SHARE_STAGES = [
  "APPLIED",
  "SHORTLISTED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
] as const;

export const TPO_SHARE_COLUMNS = [
  "name", "roll", "branch", "cgpa", "tenth", "twelfth",
  "email", "phone", "resume", "projects", "skillMatch", "stage",
] as const;

export type TpoShareStage = (typeof TPO_SHARE_STAGES)[number];
export type TpoShareColumn = (typeof TPO_SHARE_COLUMNS)[number];

export type VerifiedPercent = {
  /** Integer hundredths of a percent: 8250 = 82.50%. */
  basisPoints: number;
  verified: boolean;
};

export type TpoShareApplicant = {
  applicantId: string;
  stage: string;
  firstName: string | null;
  lastName: string | null;
  roll: string | null;
  branch: string | null;
  email: string | null;
  phone: string | null;
  /** Caller must resolve a platform-controlled download URL; never fetch arbitrary URLs. */
  resumeUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  skillMatchScore: number | null;
  marks: Partial<Record<"UG" | "10TH" | "12TH" | "DIPLOMA", VerifiedPercent>>;
  /** True only for an accepted offer on this drive. */
  hiredOnDrive: boolean;
};

export type TpoShareVisibility = {
  showCgpaExact: boolean;
  showTenthTwelfth: boolean;
  showProjectLinks: boolean;
  showAssessmentScores: boolean;
  showAttendance: boolean;
};

export const DEFAULT_TPO_SHARE_VISIBILITY: Readonly<TpoShareVisibility> = Object.freeze({
  showCgpaExact: false,
  showTenthTwelfth: true,
  showProjectLinks: true,
  showAssessmentScores: false,
  showAttendance: false,
});

const SHARE_STAGE_POSITIONS = new Map<string, number>(
  TPO_SHARE_STAGES.map((stage, i) => [stage, i] as const),
);
const SHARE_COLUMN_SET: ReadonlySet<string> = new Set(TPO_SHARE_COLUMNS);
const RETENTION_MILLISECONDS = 90 * 24 * 60 * 60 * 1000;

function verifiedPercentage(value: VerifiedPercent | undefined): number | null {
  if (
    !value?.verified ||
    !Number.isSafeInteger(value.basisPoints) ||
    value.basisPoints < 0 ||
    value.basisPoints > 10000
  ) return null;
  return value.basisPoints;
}

/** Retained legacy "cgpa" share key means verified UG percentage, not raw CGPA. */
function formatUgPercentage(bps: number, exact: boolean): string {
  if (exact) {
    const roundedTenths = Math.round(bps / 10);
    return String(roundedTenths / 10);
  }
  const lower = Math.min(95, Math.floor(bps / 500) * 5);
  return `${lower}-${lower + 5}%`;
}

/** A malformed stage fails closed, even when a link has no max-stage filter. */
export function projectTpoShareApplicant(input: {
  applicant: TpoShareApplicant;
  requestedColumns: readonly string[];
  visibility: TpoShareVisibility;
  maxStage?: TpoShareStage | null;
  driveClosedAt?: Date | null;
  now: Date;
}): Record<string, string | number | null> | null {
  const { applicant, requestedColumns, visibility, maxStage, driveClosedAt, now } = input;
  const position = SHARE_STAGE_POSITIONS.get(applicant.stage);
  if (position === undefined || !Number.isFinite(now.getTime())) return null;
  if (maxStage !== undefined && maxStage !== null) {
    const ceiling = SHARE_STAGE_POSITIONS.get(maxStage);
    if (ceiling === undefined || position > ceiling) return null;
  }

  const retained =
    driveClosedAt instanceof Date &&
    Number.isFinite(driveClosedAt.getTime()) &&
    driveClosedAt.getTime() < now.getTime() - RETENTION_MILLISECONDS &&
    !applicant.hiredOnDrive;

  // Never spread the source applicant, which includes private/unsafe fields.
  const projected: Record<string, string | number | null> = {
    applicantId: applicant.applicantId,
  };
  const allowed = new Set(
    requestedColumns.filter((column) => SHARE_COLUMN_SET.has(column)),
  );

  if (allowed.has("name")) {
    projected["name"] = [applicant.firstName, applicant.lastName]
      .filter((part) => part?.trim())
      .join(" ");
  }
  if (allowed.has("roll")) projected["roll"] = applicant.roll;
  if (allowed.has("branch")) projected["branch"] = applicant.branch;

  const ug = verifiedPercentage(applicant.marks.UG);
  if (allowed.has("cgpa") && ug !== null) {
    projected["cgpa"] = formatUgPercentage(ug, visibility.showCgpaExact);
  }
  if (visibility.showTenthTwelfth) {
    const tenth = verifiedPercentage(applicant.marks["10TH"]);
    if (allowed.has("tenth") && tenth !== null) {
      projected["tenth"] = tenth / 100;
    }
    if (allowed.has("twelfth")) {
      const twelfth = verifiedPercentage(applicant.marks["12TH"]) ??
        verifiedPercentage(applicant.marks.DIPLOMA);
      if (twelfth !== null) projected["twelfth"] = twelfth / 100;
    }
  }

  if (!retained) {
    if (allowed.has("email")) projected["email"] = applicant.email;
    if (allowed.has("phone") && position >= TPO_SHARE_STAGES.indexOf("SHORTLISTED")) {
      projected["phone"] = applicant.phone;
    }
    if (allowed.has("resume")) projected["resume"] = applicant.resumeUrl;
    if (allowed.has("projects") && visibility.showProjectLinks) {
      projected["github"] = applicant.githubUrl;
      projected["portfolio"] = applicant.portfolioUrl;
    }
  }

  // Security tightening relative to legacy: use this explicit college toggle.
  if (
    allowed.has("skillMatch") &&
    visibility.showAssessmentScores &&
    applicant.skillMatchScore !== null &&
    Number.isFinite(applicant.skillMatchScore)
  ) projected["skillMatch"] = Math.round(applicant.skillMatchScore);

  // Attendance is deliberately not a share column even when its toggle is true.
  if (allowed.has("stage")) projected["stage"] = applicant.stage;
  return projected;
}
