import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,verificationAgeBandValid,verificationSectionEvidenceFiltersValid,verificationWaitingAttentionValid} from "./queue-filters";
import {verificationSubmissionWindowValid} from "./queue-waiting-since";
/** Reject ambiguous duplicate keys rather than silently taking the last value. */
export function parseVerificationExportQuery(params:URLSearchParams){
 const raw:Record<string,string>={};
 for(const key of params.keys()){
  if(params.getAll(key).length!==1)throw new Error("DUPLICATE_VERIFICATION_EXPORT_FILTER");
  raw[key]=params.get(key)??"";
 }
 const parsed=verificationQueueFilters.safeParse(raw);
 if(!parsed.success||!verificationSubmissionWindowValid(parsed.data)||!verificationWaitingStateValid(parsed.data)||!verificationEnrollmentFiltersValid(parsed.data)||!verificationAgeBandValid(parsed.data)||!verificationSectionEvidenceFiltersValid(parsed.data)||!verificationWaitingAttentionValid(parsed.data))
  throw new Error("VERIFICATION_FILTER_NOT_SUPPORTED");
 return parsed.data;
}
