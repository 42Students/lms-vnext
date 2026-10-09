/**
 * Legacy V188: registration is opened by invitation for each academic cohort.
 * Deadline is exclusive. A finished cohort cannot self-register.
 *
 * Caller MUST separately check enabled paid module and effective learner
 * participation (inherited MEMBER > SECTION > COHORT) inside its write scope.
 */
export type PlacementRegistrationChoice =
  | "PLACEMENTS"
  | "HIGHER_STUDIES"
  | "NOT_INTERESTED"
  | "ENTREPRENEURSHIP"
  | "COMPETITIVE_EXAMS";

export type RegistrationWindow = {
  invitedAt: Date | null;
  finishedAt: Date | null;
  deadline: Date | null;
};

export type RegistrationWindowResult = {
  invited: boolean;
  finished: boolean;
  open: boolean;
  deadline: Date | null;
};

export const PLACEMENT_REGISTRATION_CONSENT_VERSION = "v1";

export function resolveRegistrationWindow(
  batch: RegistrationWindow | null,
  now: Date,
): RegistrationWindowResult {
  if (!batch) {
    return { invited: false, finished: false, open: false, deadline: null };
  }
  const invited = batch.invitedAt !== null;
  const finished = batch.finishedAt !== null;
  return {
    invited,
    finished,
    open: invited && !finished &&
      (batch.deadline === null || now.getTime() < batch.deadline.getTime()),
    deadline: batch.deadline,
  };
}

export type RegistrationWrite = {
  choice: PlacementRegistrationChoice;
  consentVersion: string | null;
  consentAt: Date | null;
};

export function createRegistrationWrite(input: {
  choice: PlacementRegistrationChoice;
  acceptedConsent: boolean;
  now: Date;
}): RegistrationWrite {
  if (input.choice === "PLACEMENTS" && !input.acceptedConsent) {
    throw new Error("DB08_REGISTRATION_CONSENT_REQUIRED");
  }
  if (input.choice !== "PLACEMENTS" && input.acceptedConsent) {
    throw new Error("DB08_REGISTRATION_CONSENT_NOT_APPLICABLE");
  }
  return {
    choice: input.choice,
    consentVersion: input.choice === "PLACEMENTS"
      ? PLACEMENT_REGISTRATION_CONSENT_VERSION : null,
    consentAt: input.choice === "PLACEMENTS" ? input.now : null,
  };
}

/** Original V1 rules: a date limit takes precedence over drive-count limit. */
export function isDebarmentActive(
  record: {
    liftedAt: Date | null;
    untilDate: string | null; // YYYY-MM-DD in the college's local date
    untilDrives: number | null;
    drivesCounted: number;
  },
  collegeLocalDate: string,
): boolean {
  if (record.liftedAt !== null) return false;
  if (record.untilDate !== null) {
    return collegeLocalDate <= record.untilDate;
  }
  return record.untilDrives === null || record.drivesCounted < record.untilDrives;
}
