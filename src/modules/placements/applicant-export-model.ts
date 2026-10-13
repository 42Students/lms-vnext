/**
 * Pure projection for the TPO per-drive applicant CSV.
 *
 * One row represents one persisted placement application, not one
 * unique learner. A learner applying to two job role options therefore
 * produces two rows.
 *
 * Branch records must arrive newest-enrollment-first. Prefer the
 * active enrollment, otherwise retain the newest historical branch.
 *
 * Applied round outcomes are selected by the highest non-cancelled
 * round sequence, not by result submission time. The caller must
 * supply only APPLIED results from non-cancelled rounds.
 */

export const PLACEMENT_APPLICANTS_CSV_HEADINGS = [
  "Student name",
  "Roll number",
  "Branch",
  "Application status",
  "Screening status",
  "Latest round outcome",
] as const;

export type PlacementApplicantExportApplication = {
  applicationId: string;
  membershipId: string;
  studentName: string;
  rollNumber: string | null;
  applicationStatus: string;
  screeningStatus: string | null;
};

export type PlacementApplicantExportBranch = {
  membershipId: string;
  branchName: string;
  enrollmentStatus: string;
};

export type PlacementApplicantExportRoundResult = {
  applicationId: string;
  roundId: string;
  sequence: number;
  outcome: string;
};

export type PlacementApplicantExportInput = {
  applications: readonly PlacementApplicantExportApplication[];
  branches: readonly PlacementApplicantExportBranch[];
  appliedResults: readonly PlacementApplicantExportRoundResult[];
};

export function buildPlacementApplicantCsvRows(
  input: PlacementApplicantExportInput,
): string[][] {
  const branchByMembership = new Map<
    string,
    PlacementApplicantExportBranch
  >();

  for (const branch of input.branches) {
    const previous = branchByMembership.get(
      branch.membershipId,
    );

    if (
      !previous ||
      (previous.enrollmentStatus !== "ACTIVE" &&
        branch.enrollmentStatus === "ACTIVE")
    ) {
      branchByMembership.set(
        branch.membershipId,
        branch,
      );
    }
  }

  const latestResultByApplication = new Map<
    string,
    PlacementApplicantExportRoundResult
  >();

  for (const result of input.appliedResults) {
    const previous = latestResultByApplication.get(
      result.applicationId,
    );

    if (
      !previous ||
      result.sequence > previous.sequence ||
      (result.sequence === previous.sequence &&
        result.roundId > previous.roundId)
    ) {
      latestResultByApplication.set(
        result.applicationId,
        result,
      );
    }
  }

  return input.applications.map((application) => [
    application.studentName,
    application.rollNumber ?? "",
    branchByMembership.get(
      application.membershipId,
    )?.branchName ?? "",
    application.applicationStatus,
    application.screeningStatus ?? "",
    latestResultByApplication.get(
      application.applicationId,
    )?.outcome ?? "",
  ]);
}
