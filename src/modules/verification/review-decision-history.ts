import { DEFAULT_TIME_ZONE } from "@/config/locale";
/** Read-only persisted decision context, never inferred from the current queue tab. */
export function verificationDecisionHistory(input:{decidedAt:string|null;note:string|null}){
 const date=input.decidedAt?new Date(input.decidedAt):null;
 const decidedAt=date!==null&&Number.isFinite(date.getTime())
  ?new Intl.DateTimeFormat("en-IN",{timeZone:DEFAULT_TIME_ZONE,dateStyle:"medium",timeStyle:"short"}).format(date):null;
 return {
  decidedAt,
  note:input.note?.trim()||null,
 };
}
