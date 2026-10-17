/** UI-only wording for persisted eligibility and registration events. */
export function batchDecisionLabel(value:string|null|undefined):string{
 if(!value||value==="NOT_DECIDED")return "Not decided";
 if(value==="ELIGIBLE")return "Eligible";
 if(value==="INELIGIBLE")return "Ineligible";
 return "Needs review";
}
export function batchSourceLabel(value:string|null|undefined):string{
 if(value==="LEARNER")return "Own decision";
 if(value==="CLASS")return "From class";
 if(value==="BATCH")return "From batch";
 return "Not recorded";
}
export function batchRegistrationLabel(value:string|null|undefined):string{
 if(value==="PLACEMENTS")return "Placements";
 if(value==="HIGHER_STUDIES")return "Higher studies";
 if(value==="NOT_INTERESTED")return "Not interested";
 if(value==="ENTREPRENEURSHIP")return "Entrepreneurship";
 if(value==="COMPETITIVE_EXAMS")return "Competitive exams";
 return "Not recorded";
}
export function batchHistoryDate(value:Date):string{
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",
  hour:"numeric",minute:"2-digit",hour12:true,
 }).format(value)+" IST";
}
export function batchRuleDate(value:Date|null|undefined):string{
 return value?batchHistoryDate(value):"Not recorded";
}
