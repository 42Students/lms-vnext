/** Exactly the nine V1 ChoicesController recruiterLeadSources options.
 * MANUAL and IMPORT are system labels, never user-pickable form values.
 * Keep their values for history/reporting even when the editor hides them. */
export const RECRUITER_LEAD_SOURCE_OPTIONS = [
 {value:"ALUMNI",label:"Alumni",pickable:true},
 {value:"REFERRAL",label:"Referral",pickable:true},
 {value:"LINKEDIN",label:"LinkedIn",pickable:true},
 {value:"JOB_PORTAL",label:"Job portal",pickable:true},
 {value:"EVENT",label:"Event or job fair",pickable:true},
 {value:"COLD_OUTREACH",label:"Cold outreach",pickable:true},
 {value:"COMPANY_REACHED_OUT",label:"Company reached out",pickable:true},
 {value:"MANUAL",label:"Added by hand",pickable:false},
 {value:"IMPORT",label:"Imported",pickable:false},
] as const;
export type RecruiterLeadSource = (typeof RECRUITER_LEAD_SOURCE_OPTIONS)[number]["value"];
export const PICKABLE_RECRUITER_LEAD_SOURCES =
 RECRUITER_LEAD_SOURCE_OPTIONS.filter(source=>source.pickable);
export function recruiterLeadSourceLabel(source:string|null|undefined){
 return RECRUITER_LEAD_SOURCE_OPTIONS.find(option=>option.value===source)?.label??"Not recorded";
}
export function normalizePickedRecruiterLeadSource(
 raw:string|null|undefined,
):RecruiterLeadSource|null{
 if(!raw?.trim())return null;
 const value=raw.trim().toLowerCase();
 const result=PICKABLE_RECRUITER_LEAD_SOURCES.find(option=>
  option.value.toLowerCase()===value.replaceAll(" ","_")||option.label.toLowerCase()===value);
 if(!result)throw new Error("Choose a recruiter lead source from the available options");
 return result.value;
}

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
