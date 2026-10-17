export type TpoRecruiterLeadStage =
  | "NEW"
  | "CONTACTED"
  | "INVITED"
  | "JOINED"
  | "DRIVE_PLANNED"
  | "RECRUITED"
  | "NOT_NOW";

/** Exact legacy dev src/components/tpo/recruiterLeadStages.js copy. */
export const RECRUITER_STAGE_LEGACY_LABELS: Readonly<Record<TpoRecruiterLeadStage,string>> = {
 NEW:"New", CONTACTED:"Contacted", INVITED:"Invited",
 JOINED:"Joined", DRIVE_PLANNED:"Drive planned",
 RECRUITED:"Recruited", NOT_NOW:"Not now",
};

export type TpoRecruiterInviteStatus =
  | "NOT_SENT"
  | "SENT"
  | "CLICKED"
  | "BOUNCED"
  | "JOINED";

/**
 * Exact legacy stage precedence from TpoRecruiterLeadsHubService:
 * NOT_NOW > RECRUITED > DRIVE_PLANNED > JOINED > INVITED > CONTACTED > NEW.
 *
 * hasRecruitedFact and hasPlannedDriveFact must come from placement
 * execution facts. W05 must never persist these derived stages.
 */
export function deriveTpoRecruiterLeadStage(input: Readonly<{
  manualStage: string;
  hasRecruitedFact: boolean;
  hasPlannedDriveFact: boolean;
  recruiterUserId: string | null;
  inviteSentAt: Date | null;
}>): TpoRecruiterLeadStage {
  if (input.manualStage === "NOT_NOW") return "NOT_NOW";
  if (input.hasRecruitedFact) return "RECRUITED";
  if (input.hasPlannedDriveFact) return "DRIVE_PLANNED";
  if (input.recruiterUserId) return "JOINED";
  if (input.inviteSentAt) return "INVITED";
  if (input.manualStage === "CONTACTED") return "CONTACTED";
  return "NEW";
}

export function deriveTpoRecruiterInviteStatus(input: Readonly<{
  recruiterUserId: string | null;
  inviteSentAt: Date | null;
  inviteClickedAt: Date | null;
  inviteBouncedAt: Date | null;
}>): TpoRecruiterInviteStatus {
  if (input.recruiterUserId) return "JOINED";
  if (input.inviteBouncedAt) return "BOUNCED";
  if (input.inviteClickedAt) return "CLICKED";
  if (input.inviteSentAt) return "SENT";
  return "NOT_SENT";
}

const LEGACY_FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "live.com",
  "msn.com",
  "proton.me",
  "protonmail.com",
  "mail.com",
  "yahoo.co.in",
]);

/**
 * Legacy add-lead convenience: infer the company from a work-email domain
 * only when the TPO did not provide a company. Keep this intentionally small
 * and source-compatible rather than guessing from consumer email providers.
 */
export function inferLegacyRecruiterCompanyName(
  email: string | null | undefined,
): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || LEGACY_FREE_MAIL_DOMAINS.has(domain)) return null;
  const firstLabel = domain.split(".")[0]?.trim();
  return firstLabel ? firstLabel.slice(0,1).toUpperCase()+firstLabel.slice(1) : null;
}
