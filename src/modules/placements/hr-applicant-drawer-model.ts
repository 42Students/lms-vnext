import type { SharedApplicant } from "./hr-job-applicants-model";
export function buildHrApplicantDrawer(
  rows: readonly SharedApplicant[],
  applicantId: string | undefined,
) {
  if (!applicantId) return null;
  const selected = rows.find(row => row.id === applicantId && row.screening === "SHORTLISTED");
  if (!selected) return null;
  return {
    id:selected.id,
    name:selected.name?.trim() || "Unnamed applicant",
    role:selected.role,
    email:selected.email,
    rollNumber:selected.rollNumber??null,
    status:selected.status,
    screening:selected.screening,
    submittedAt:selected.submittedAt,
  };
}
