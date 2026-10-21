import {z} from "zod";

/** Legacy TPO DriveForm -> reviewed, tenant-scoped modern drive draft.
 * Imported numeric company/season IDs are locators only: they never authorize
 * data access and may NOT be written as placement UUIDs without a college-
 * scoped resolver. This adapter performs no network or database activity. */
export const LEGACY_TPO_DRIVE_FORM_FIELDS={
 jobTitle:"placement_jobs.title",
 companyName:"placement_company_relationships.company_id (resolved scoped name)",
 companyLogo:"placement_companies.logo_object_path (trusted media ingest only)",
 companyId:"placement_company_relationships (resolve legacy company ID under college)",
 jobDescription:"placement_jobs.description",
 recordedOutside:"placement_jobs.recorded_outside",
 jdUrl:"placement_jobs.legacy_job_description_url (verified external HTTPS only)",
 location:"placement_jobs.locations[0]",
 driveMode:"placement_jobs.legacy_drive_mode + recruiter_drive_mode",
 hostCollegeName:"placement_jobs.legacy_posting_details.campusPool.hostCollege",
 reportingAt:"placement_jobs.legacy_posting_details.campusPool.reportingTime (IST)",
 travelNote:"placement_jobs.legacy_posting_details.campusPool.travelNote",
 externalApplyUrl:"placement_jobs.external_application_url (verified HTTPS only)",
 requiresExternalRegistration:"placement_jobs.legacy_posting_details.portal.studentsRegisterSeparately",
 externalPortalName:"placement_jobs.legacy_posting_details.portal.name",
 externalPortalUrl:"placement_jobs.legacy_posting_details.portal.url",
 wantedSkills:"placement_jobs.legacy_posting_details.skillsWanted",
 jobType:"placement_jobs.employment_type + job_type_label (review conversion)",
 category:"placement_jobs.dream_category + is_dream (explicit or pay-classified)",
 categoryOverrideReason:"placement_jobs.legacy_category_override_reason",
 roleOptions:"placement_job_role_options[] (resolve imported IDs and pay)",
 eligibility:"placement_job_eligibility (validate under college)",
 rounds:"placement_job_rounds[] (ordered, validated, no foreign IDs)",
 applicationDeadline:"placement_jobs.application_deadline (convert from source IST)",
 seasonId:"placement_jobs.season_id (resolve numeric legacy season under college)",
 notifyApplicants:"notification outbox only on an authorized live update, never import",
} as const;

const legacyDriveFormSchema=z.object({
 jobTitle:z.string().trim().max(200).nullish(),
 companyName:z.string().trim().max(200).nullish(),
 companyLogo:z.string().trim().max(2000).nullish(),
 companyId:z.number().int().positive().nullish(),
 jobDescription:z.string().max(30000).nullish(),
 recordedOutside:z.boolean().nullish(),
 jdUrl:z.string().trim().max(2000).nullish(),
 location:z.string().trim().max(500).nullish(),
 driveMode:z.enum(["ON_CAMPUS","POOL","OFF_CAMPUS"]).nullish(),
 hostCollegeName:z.string().trim().max(160).nullish(),
 reportingAt:z.string().trim().max(40).nullish(),
 travelNote:z.string().trim().max(1000).nullish(),
 externalApplyUrl:z.string().trim().max(2000).nullish(),
 requiresExternalRegistration:z.boolean().nullish(),
 externalPortalName:z.string().trim().max(160).nullish(),
 externalPortalUrl:z.string().trim().max(2000).nullish(),
 wantedSkills:z.array(z.string().trim().min(1).max(50)).max(30).nullish(),
 jobType:z.string().trim().max(80).nullish(),
 category:z.enum(["REGULAR","DREAM","SUPER_DREAM"]).nullish(),
 categoryOverrideReason:z.string().trim().max(500).nullish(),
 roleOptions:z.array(z.record(z.string(),z.unknown())).max(100).nullish(),
 eligibility:z.record(z.string(),z.unknown()).nullish(),
 rounds:z.array(z.record(z.string(),z.unknown())).max(100).nullish(),
 applicationDeadline:z.string().trim().max(40).nullish(),
 seasonId:z.number().int().positive().nullish(),
 notifyApplicants:z.boolean().nullish(),
}); // Legacy Jackson ignored unknown keys; Zod drops them too.

const safeLink=(raw:string|null|undefined):string|null=>{
 if(!raw)return null;
 try{
  const url=new URL(raw);
  return url.protocol==="https:"&&url.hostname&&!url.username&&!url.password
   ?url.toString():null;
 }catch{return null;}
};
const legacyLocalDateTime=(raw:string|null|undefined):string|null=>{
 if(!raw)return null;
 // Preserve LocalDateTime and source zone separately, rather than parsing
 // into a browser-local timestamp or assuming an unsafe UTC offset.
 return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/.test(raw)?raw:null;
};

/** Produces explicit fields and review blockers, never an auto-publish command.
 * Resolution of company, season, eligibility and role options remains mandatory
 * in the authenticated importer before any write or notification. */
export function crosswalkLegacyTpoDriveForm(raw:unknown){
 const input=legacyDriveFormSchema.parse(raw);
 const warnings:string[]=[];
 const title=input.jobTitle?.trim()??"";
 if(title.length<3)warnings.push("A role title must be supplied before import.");
 if(!input.companyId&&!input.companyName)warnings.push("Select an authorized company relationship.");
 if(!input.seasonId)warnings.push("Choose the selected college's placement season.");
 if(input.companyLogo)warnings.push("Legacy company logo requires safe media ingestion; external URL cannot be persisted as a signed object.");
 if(input.jdUrl&&!safeLink(input.jdUrl))warnings.push("JD URL cannot be imported without an authorized HTTPS destination.");
 if(input.externalApplyUrl&&!safeLink(input.externalApplyUrl))warnings.push("External application URL must be a public HTTPS destination.");
 if(input.externalPortalUrl&&!safeLink(input.externalPortalUrl))warnings.push("External portal must be a public HTTPS destination.");
 if(input.applicationDeadline&&!legacyLocalDateTime(input.applicationDeadline))
  warnings.push("Resolve invalid original application deadline with the placement cell.");
 if(input.reportingAt&&!legacyLocalDateTime(input.reportingAt))
  warnings.push("Resolve invalid original reporting time with the placement cell.");
 if(input.requiresExternalRegistration&&!input.externalPortalUrl)
  warnings.push("External registration requires a verified portal URL.");
 if(!input.jobType)warnings.push("Review and select the modern employment type.");
 if(!input.category)warnings.push("Classify REGULAR / DREAM / SUPER_DREAM after verified CTC; never guess.");
 if(!input.roleOptions?.length)warnings.push("Validate at least one role option and pay package.");
 if(!input.eligibility)warnings.push("Reapply eligible branches, marks and backlogs through scoped eligibility validation.");
 if(!input.rounds?.length)warnings.push("Review interview/assessment rounds before publishing.");
 return {
  readyForPersistence:false as const,sourceTimeZone:"Asia/Kolkata" as const,
  title,description:input.jobDescription??"",locations:input.location?[input.location]:[],
  recordedOutside:input.recordedOutside??false,
  sourceCompany:{legacyCompanyId:input.companyId??null,name:input.companyName??null},
  sourceSeasonId:input.seasonId??null,
  jdUrl:safeLink(input.jdUrl),companyLogoRequiresIngest:Boolean(input.companyLogo),
  legacyDriveMode:input.driveMode??"ON_CAMPUS",
  recruiterDriveMode:input.driveMode==="OFF_CAMPUS"?"OFF_CAMPUS":"ON_CAMPUS",
  externalApplicationUrl:safeLink(input.externalApplyUrl),
  campusPool:{hostCollege:input.hostCollegeName??"",
   reportingAtLocal:legacyLocalDateTime(input.reportingAt),
   travelNote:input.travelNote??""},
  portal:{studentsRegisterSeparately:input.requiresExternalRegistration??false,
   name:input.externalPortalName??"",url:safeLink(input.externalPortalUrl)},
  skillsWanted:input.wantedSkills??[],
  rawJobType:input.jobType??null,category:input.category??null,
  categoryOverrideReason:input.categoryOverrideReason??null,
  roleOptionsToValidate:input.roleOptions??[],
  eligibilityToValidate:input.eligibility??null,roundsToValidate:input.rounds??[],
  applicationDeadlineLocal:legacyLocalDateTime(input.applicationDeadline),
  notifyApplicants:false as const,
  importReviewWarnings:warnings,
 };
}
