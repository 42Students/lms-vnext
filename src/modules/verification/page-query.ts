import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,verificationAgeBandValid,verificationSectionEvidenceFiltersValid} from "./queue-filters";
import {verificationSubmissionWindowValid} from "./queue-waiting-since";
export function parseCollegeVerificationPageQuery(raw:Record<string,string|string[]|undefined>){
 const query:Record<string,string>={};
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))return {success:false as const};
  if(value!==undefined&&value!=="")query[key]=value;
 }
 const parsed=verificationQueueFilters.safeParse(query);
 if(!parsed.success||!verificationSubmissionWindowValid(parsed.data)||!verificationWaitingStateValid(parsed.data)||!verificationEnrollmentFiltersValid(parsed.data)||!verificationAgeBandValid(parsed.data)||!verificationSectionEvidenceFiltersValid(parsed.data))return {success:false as const};
 return {success:true as const,data:parsed.data};
}
