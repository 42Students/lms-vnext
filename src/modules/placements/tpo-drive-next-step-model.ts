/**
 * TPO-drive-workspace-02: one actionable next step, followed by at most three
 * valid secondary actions. All counts come from persisted college-scoped reads.
 * Never claim staged selections can be released when there is no release path.
 */
export type TpoDriveAction = {
  label: string;
  description: string;
  href: string;
};
export type TpoDriveNextStepInput = {
  jobId: string;
  status: string;
  publishAllowed: boolean;
  closeAllowed: boolean;
  shortlistCount: number | null;
  applicantCount?: number;
  recordedOutside?: boolean;
  deadlinePassed?: boolean;
  pendingSelections?: number;
  pendingRequests: number;
  nonApplicantCount?: number;
  canRemindNonApplicants?: boolean;
  deadlineMissing?: boolean;
  stagedRounds: Array<{ id: string; name: string; pendingCount: number }>;
};
export const TPO_DRIVE_REQUEST_DECLINED_SUCCESS = "Request declined. It is now cancelled.";

export function projectTpoDriveNextStep(input: TpoDriveNextStepInput): {
  primary: TpoDriveAction;
  more: TpoDriveAction[];
} {
  const root = "/tpo/placements/jobs/" + encodeURIComponent(input.jobId);
  const actions: TpoDriveAction[] = [];
  if (input.status === "DRAFT") {
    actions.push(input.publishAllowed ? {
      label: "Publish",
      description: "Review the eligibility and announcement before publishing.",
      href: "#drive-lifecycle-publish",
    } : {
      label: "Fix these before publishing",
      description: "The publish checks need attention. Update the draft and retry.",
      href: root + "/edit",
    });
    if (input.publishAllowed) actions.push({
      label: "Edit draft",
      description: "Review company, role and eligibility details.",
      href: root + "/edit",
    });
  } else if (input.status === "PUBLISHED") {
    if (input.recordedOutside && input.applicantCount === 0) actions.push({
      label: "Add students who took part",
      description: "Record the students who took part in this outside drive.",
      href: root + "/applicants-pipeline",
    });
    if (!input.recordedOutside && input.deadlinePassed && (input.applicantCount ?? 0) > 0) actions.push({
      label: "Share " + input.applicantCount + " applicants with company",
      description: "Review the applicants and choose what the company can see.",
      href: root + "/share-preview",
    });
    if(input.deadlineMissing) actions.push({
      label:"Set deadline",description:"This drive has no application deadline. Set one so students know when applications close.",
      href:"#drive-deadline-actions",
    });
    const pending = input.stagedRounds
      .filter(round => round.pendingCount > 0)
      .sort((a, b) => b.pendingCount - a.pendingCount);
    if (pending[0]) actions.push({
      label: "Review and apply " + pending[0].pendingCount + " result(s)",
      description: pending[0].name + " has results to review before students are told.",
      href: "#drive-round-actions",
    });
    if (input.pendingRequests > 0) actions.push({
      label: "Review " + input.pendingRequests + " request(s)",
      description: "Students are waiting for a decision from the placement cell.",
      href: "#drive-request-actions",
    });
    if ((input.pendingSelections ?? 0) > 0) actions.push({
      label: "Verify and release " + input.pendingSelections + " selection(s)",
      description: "Recorded employer selections still need verification before official offers are issued.",
      href: root + "/selections",
    });
    if (!input.deadlinePassed && input.shortlistCount !== null && input.shortlistCount > 0) actions.push({
      label: "Share with company",
      description: input.shortlistCount + " shortlisted application(s) are available for review.",
      href: root + "/share-preview",
    });
    if (input.canRemindNonApplicants && (input.nonApplicantCount ?? 0) > 0) actions.push({
      label: "Remind all",
      description: input.nonApplicantCount + " eligible registered students have not applied. Remind once today before the deadline.",
      href: "#drive-registered-not-applied",
    });
    actions.push({
      label: "Applicants",
      description: "Review the application pipeline and decisions.",
      href: root + "/applicants-pipeline",
    });
    if (input.closeAllowed) actions.push({
      label: "Close drive",
      description: "Preview consequences and notify affected students before closing.",
      href: root + "/close-preview",
    });
  } else {
    actions.push({
      label: "Applicants",
      description: "Review this drive's final applicant record.",
      href: root + "/applicants-pipeline",
    });
  }
  return { primary: actions[0]!, more: actions.slice(1, 4) };
}
