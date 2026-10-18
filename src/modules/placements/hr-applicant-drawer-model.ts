import type { SharedApplicant } from "./hr-job-applicants-model";
export function buildHrApplicantDrawer(
  rows: readonly SharedApplicant[],
  applicantId: string | undefined,
) {
  if (!applicantId) return null;
  // A withdrawn application may remain historically SHORTLISTED. Do not let an
  // already-open applicant URL retain access to private project or contact details.
  const matching = rows.filter(row => row.id === applicantId);
  // A join or pagination bug producing conflicting copies must not let the
  // first row's private details override a revoked or withdrawn duplicate.
  if (matching.length !== 1) return null;
  const selected = matching[0]!;
  if (selected.screening !== "SHORTLISTED" || selected.status !== "SUBMITTED") return null;
  return {
    id:selected.id,
    name:selected.name?.trim() || "Unnamed applicant",
    role:selected.role,
    email:selected.email,
    rollNumber:selected.rollNumber??null,
    branch:selected.branch??null,
    phone:selected.phone??null,
    resumeShared:selected.resumeShared??false,
    githubUrl:selected.githubUrl??null,portfolioUrl:selected.portfolioUrl??null,
    sharedSkills:selected.sharedSkills??[],sharedProjects:selected.sharedProjects??[],
    ugPercentage:selected.ugPercentage??null,
    tenthPercentage:selected.tenthPercentage??null,
    twelfthOrDiplomaPercentage:selected.twelfthOrDiplomaPercentage??null,
    status:selected.status,
    screening:selected.screening,
    submittedAt:selected.submittedAt,
  };
}
