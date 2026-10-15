/** Read-only persisted decision context, never inferred from the current queue tab. */
export function verificationDecisionHistory(input:{decidedAt:string|null;note:string|null}){
 const date=input.decidedAt?new Date(input.decidedAt):null;
 const hasDate=date!==null&&Number.isFinite(date.getTime());
 return {
  decidedAt:hasDate?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(date):null,
  note:input.note?.trim()||null,
 };
}
