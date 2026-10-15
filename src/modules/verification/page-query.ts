import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,verificationAgeBandValid,verificationSectionEvidenceFiltersValid,verificationWaitingAttentionValid,verificationAttentionAgeCompatible} from "./queue-filters";
import {verificationSubmissionWindowValid} from "./queue-waiting-since";
export function parseCollegeVerificationPageQuery(raw:Record<string,string|string[]|undefined>){
 const entries:[string,string][]=[];
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))return {success:false as const};
  if(value!==undefined&&value!=="")entries.push([key,value]);
 }
 const query=Object.fromEntries(entries);
 const parsed=verificationQueueFilters.safeParse(query);
 if(!parsed.success||!verificationSubmissionWindowValid(parsed.data)||!verificationWaitingStateValid(parsed.data)||!verificationEnrollmentFiltersValid(parsed.data)||!verificationAgeBandValid(parsed.data)||!verificationSectionEvidenceFiltersValid(parsed.data)||!verificationWaitingAttentionValid(parsed.data)||!verificationAttentionAgeCompatible(parsed.data))return {success:false as const};
 return {success:true as const,data:parsed.data};
}

/** Explain only the allowed filter categories, not the user's raw URL or internal identifiers. */
export function collegeVerificationFilterError(raw:Record<string,string|string[]|undefined>):string {
 if(Object.values(raw).some(Array.isArray))
  return "Repeated verification filters are not permitted. No records were loaded.";
 const query=Object.fromEntries(Object.entries(raw).filter(([,value])=>value!==""&&value!==undefined));
 const parsed=verificationQueueFilters.safeParse(query);
 if(!parsed.success)return "A verification status, date or page filter is invalid. No records were loaded.";
 const f=parsed.data;
 if(!verificationSubmissionWindowValid(f))
  return "The submission start date must not follow the end date. No records were loaded.";
 if(!verificationWaitingStateValid(f)||!verificationAgeBandValid(f)||!verificationWaitingAttentionValid(f))
  return "Waiting-only filters require the Waiting tab. No records were loaded.";
 if(!verificationEnrollmentFiltersValid(f))
  return "An academic assignment cannot be combined with no active enrollment. No records were loaded.";
 if(!verificationSectionEvidenceFiltersValid(f))
  return "Identity verification cannot use education marksheet requirements. No records were loaded.";
 if(!verificationAttentionAgeCompatible(f))
  return "The selected verification waiting-age and attention filters conflict. No records were loaded.";
 return "Verification filters are invalid. No records were loaded.";
}
