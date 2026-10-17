import { z } from "zod";

export const tpoDriveLifecycleSchema = z.object({
  action: z.enum(["PUBLISH", "CLOSE", "REOPEN"]),
  expectedStatus: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]),
  confirmed: z.literal(true),
  reason: z.string().trim().min(10).max(1000),
  notifyByEmail:z.boolean().optional().default(false),
}).strict();

export type TpoDriveReadinessFacts = {
  jobStatus: string;
  seasonActive: boolean;
  companyActive: boolean;
  roleCount: number;
  evaluativeRoundCount: number;
  policyPersisted: boolean;
  deadlineValid: boolean;
  deadlinePresent: boolean;
  payPresent: boolean;
  externalUrlPresent: boolean;
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
    if (!facts.deadlinePresent) blockers.push("APPLICATION_DEADLINE_MISSING");
    if (!facts.payPresent) blockers.push("PACKAGE_MISSING");
    if (!facts.externalUrlPresent) blockers.push("EXTERNAL_APPLICATION_LINK_MISSING");
    if (!facts.deadlineValid) blockers.push("APPLICATION_DEADLINE_PASSED");
  }
  if (action === "REOPEN") {
    if (facts.appliedResultCount > 0) blockers.push("APPLIED_RESULTS_EXIST");
    if (facts.acceptedOfferCount > 0) blockers.push("ACCEPTED_OFFERS_EXIST");
  }
  return { allowed: blockers.length === 0, blockers };
}

/** Human-readable preflight explanations shown in the drive workspace. */
export function tpoDriveReadinessMessage(code: string): string {
  const messages: Record<string, string> = {
    STALE_JOB_STATUS: "The drive status has changed. Refresh the page.",
    SEASON_NOT_ACTIVE: "The placement season is not active.",
    COMPANY_NOT_ACTIVE: "The company is not active.",
    NO_ACTIVE_ROLE: "Add an active role before publishing.",
    NO_EVALUATIVE_ROUND: "Add at least one interview or test round.",
    ELIGIBILITY_POLICY_NOT_PERSISTED: "Save the eligibility rules before publishing.",
    APPLICATION_DEADLINE_MISSING: "Set an application deadline before publishing.",
    PACKAGE_MISSING: "Record the role package or stipend before publishing.",
    EXTERNAL_APPLICATION_LINK_MISSING: "Provide the employer application link before publishing an external drive.",
    APPLICATION_DEADLINE_PASSED: "Set an application deadline in the future.",
    APPLIED_RESULTS_EXIST: "This drive already has applied round results and cannot be reopened.",
    ACCEPTED_OFFERS_EXIST: "Accepted offers prevent reopening this drive.",
  };
  return messages[code] ?? "The drive is not ready for this action. Refresh and review the setup.";
}
