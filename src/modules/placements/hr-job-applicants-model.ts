import { z } from "zod";

export const hrApplicantFilterSchema = z.strictObject({
  tab: z.enum(["overview", "applicants", "offers", "rounds"]).default("overview"),
  stage: z.enum(["ALL", "SHORTLISTED", "WITHDRAWN"]).default("ALL"),
  applicant: z.string().uuid().optional(),
  roundId: z.string().uuid().optional(),
  outcome: z.enum(["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"]).default("ALL"),
});
export type SharedApplicant = {
  id: string; name: string | null; role: string; status: string;
  screening: string; submittedAt: Date; email: string | null;
};
export function projectSharedApplicants(rows: readonly SharedApplicant[], stage: "ALL" | "SHORTLISTED" | "WITHDRAWN") {
  const counts = {
    all: rows.length,
    shortlisted: rows.filter(row => row.status === "SUBMITTED").length,
    withdrawn: rows.filter(row => row.status === "WITHDRAWN").length,
  };
  return { counts, rows: rows.filter(row => stage === "ALL" ||
    (stage === "SHORTLISTED" && row.status === "SUBMITTED") ||
    (stage === "WITHDRAWN" && row.status === "WITHDRAWN")) };
}
