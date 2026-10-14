import { z } from "zod";

export const tpoDriveLifecycleSchema = z.object({
  action: z.enum(["PUBLISH", "CLOSE", "REOPEN"]),
  expectedStatus: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  confirmed: z.literal(true),
  reason: z.string().trim().min(10).max(1000),
}).strict();

export type TpoDriveReadinessFacts = {
  jobStatus: string;
  seasonActive: boolean;
  companyActive: boolean;
  roleCount: number;
  evaluativeRoundCount: number;
  policyPersisted: boolean;
  deadlineValid: boolean;
  appliedResultCount: number;
  acceptedOfferCount: number;
};

export function evaluateTpoDriveLifecycle(
  action: "PUBLISH" | "CLOSE" | "REOPEN",
  facts: TpoDriveReadinessFacts,
) {
  const expectedStatus =
    action === "PUBLISH" ? "DRAFT" :
    action === "CLOSE" ? "PUBLISHED" : "CLOSED";
  const blockers: string[] = [];
  if (facts.jobStatus !== expectedStatus) blockers.push("STALE_JOB_STATUS");
  if (!facts.seasonActive) blockers.push("SEASON_NOT_ACTIVE");
  if (action !== "CLOSE") {
    if (!facts.companyActive) blockers.push("COMPANY_NOT_ACTIVE");
    if (facts.roleCount < 1) blockers.push("NO_ACTIVE_ROLE");
    if (facts.evaluativeRoundCount < 1) blockers.push("NO_EVALUATIVE_ROUND");
    if (!facts.policyPersisted) blockers.push("ELIGIBILITY_POLICY_NOT_PERSISTED");
    if (!facts.deadlineValid) blockers.push("APPLICATION_DEADLINE_PASSED");
  }
  if (action === "REOPEN") {
    if (facts.appliedResultCount > 0) blockers.push("APPLIED_RESULTS_EXIST");
    if (facts.acceptedOfferCount > 0) blockers.push("ACCEPTED_OFFERS_EXIST");
  }
  return { allowed: blockers.length === 0, blockers };
}
