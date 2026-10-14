import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoShareableShortlistQuerySchema = z.object({
  jobId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

/** The recruiter round workspace exposes only these candidate identity fields. */
export type RecruiterVisibleShortlistFact = {
  applicationId: string;
  displayName: string | null;
  email: string | null;
};
export function projectRecruiterVisibleShortlist(
  facts: readonly RecruiterVisibleShortlistFact[],
) {
  return facts.map((fact) => ({
    applicationId: fact.applicationId,
    displayName: fact.displayName?.trim() || "Unnamed learner",
    email: fact.email,
  }));
}
export function tpoShareableShortlistCsv(
  rows: ReturnType<typeof projectRecruiterVisibleShortlist>,
  truncated: boolean,
) {
  const data: (string | null)[][] = rows.map((item) => [
    item.applicationId, item.displayName, item.email,
  ]);
  if (truncated) {
    data.unshift(["NOTICE", "More than 500 shortlisted application records: export truncated", ""]);
  }
  return placementReportCsv(
    ["Application ID", "Learner", "Email"], data,
  );
}
