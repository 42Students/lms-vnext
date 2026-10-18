import type { SharedApplicant } from "./hr-job-applicants-model";
export function buildHrApplicantDrawer(
  rows: readonly SharedApplicant[],
  applicantId: string | undefined,
) {
  if (!applicantId) return null;
  // A withdrawn application may remain historically SHORTLISTED. Do not let an
  // already-open applicant URL retain access to private project or contact details.
  const selected = rows.find(row => row.id === applicantId && row.screening === "SHORTLISTED" && row.status === "SUBMITTED");
  if (!selected) return null;
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
