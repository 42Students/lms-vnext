import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoShortlistQuerySchema = z.object({
  jobId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export type TpoShortlistFact = {
  applicationId: string;
  membershipId: string;
  name: string | null;
  rollNumber: string | null;
  roleTitle: string;
  decidedAt: Date | null;
};

export function projectTpoShortlist(facts: readonly TpoShortlistFact[]) {
  return facts.map((fact) => ({
    applicationId: fact.applicationId,
    membershipId: fact.membershipId,
    displayName: fact.name?.trim() || "Unnamed learner",
    rollNumber: fact.rollNumber?.trim() || null,
    roleTitle: fact.roleTitle,
    shortlistedAtIso: fact.decidedAt?.toISOString() ?? null,
  }));
}

export function tpoShortlistCsv(
  rows: ReturnType<typeof projectTpoShortlist>,
) {
  return placementReportCsv(
    ["Learner", "Roll number", "Role option", "Shortlisted at (UTC)"],
    rows.map((row) => [
      row.displayName, row.rollNumber, row.roleTitle, row.shortlistedAtIso,
    ]),
  );
}
