import {verificationQueueFilters,verificationWaitingStateValid,verificationEnrollmentFiltersValid,
  verificationAgeBandValid,verificationSectionEvidenceFiltersValid,verificationWaitingAttentionValid,
  verificationAttentionAgeCompatible} from "./queue-filters";
import {verificationSubmissionWindowValid} from "./queue-waiting-since";

/** Match the server's refusal rules before navigating away from a filled queue form. */
export function verificationFilterDraftError(query:Record<string,string>):string|null {
 const parsed=verificationQueueFilters.safeParse(query);
 if(!parsed.success)return "One or more filter values are invalid";
 const value=parsed.data;
 if(!verificationSubmissionWindowValid(value))return "Start date must not follow the end date";
 if(!verificationWaitingStateValid(value))return "Waiting request state requires the Waiting tab";
 if(!verificationAgeBandValid(value))return "Waiting-age triage requires the Waiting tab";
 if(!verificationEnrollmentFiltersValid(value))return "No active enrollment conflicts with an academic assignment";
 if(!verificationSectionEvidenceFiltersValid(value))return "Identity review cannot be filtered by education marksheets";
 if(!verificationWaitingAttentionValid(value))return "The selected attention cue requires the Waiting tab";
 if(!verificationAttentionAgeCompatible(value))return "The selected waiting age, state and attention filters conflict";
 return null;
}
