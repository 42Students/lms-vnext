import {z} from "zod";
export const verificationQueueFilters=z.strictObject({
  tab:z.enum(["WAITING","SENT_BACK","VERIFIED"]).default("WAITING"),
  waitingState:z.enum(["ALL","SUBMITTED","UPDATE_PENDING"]).default("ALL"),
  ageBand:z.enum(["ANY","WITHIN_48_HOURS","TWO_TO_SEVEN_DAYS","OVER_SEVEN_DAYS"]).default("ANY"),
  q:z.string().trim().max(100).default(""),
  membershipId:z.string().uuid().optional(),
  sectionId:z.string().uuid().optional(),
  kind:z.enum(["EDUCATION","IDENTITY"]).optional(),
  marksheets:z.enum(["ANY","MISSING","PRESENT"]).default("ANY"),
  attention:z.enum(["ALL","MISSING_MARKSHEET","VERIFIED_DETAILS_CHANGED","WAITING_OVER_WEEK"]).default("ALL"),
  batchId:z.string().uuid().optional(),
  programId:z.string().uuid().optional(),
  enrollment:z.enum(["ALL","ACTIVE","NONE"]).default("ALL"),
  branchId:z.string().uuid().optional(),
  waitingSince:z.iso.date().optional(),
  submittedFrom:z.iso.date().optional(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  sort:z.enum(["OLDEST","NEWEST","NAME"]).default("OLDEST"),
  pageSize:z.coerce.number().int().refine(value=>[10,25,50].includes(value)).default(25),
});
export type VerificationQueueFilters=z.infer<typeof verificationQueueFilters>;

/** Exact pending-state triage does not apply to already-decided tabs. */
export function verificationWaitingStateValid(filter:{tab:string;waitingState:string}):boolean {
 return filter.waitingState==="ALL"||filter.tab==="WAITING";
}

/** No enrollment cannot coexist with a specific CURRENT academic placement. */
export function verificationEnrollmentFiltersValid(filter:{enrollment:string;programId?:string|undefined;batchId?:string|undefined;branchId?:string|undefined;sectionId?:string|undefined}):boolean{
 return filter.enrollment!=="NONE"||!(filter.programId||filter.batchId||filter.branchId||filter.sectionId);
}

export function verificationAgeBandValid(filter:{tab:string;ageBand:string}):boolean{
 return filter.ageBand==="ANY"||filter.tab==="WAITING";
}

/** Marksheets are Education evidence only; never silently show an empty Identity queue. */
export function verificationSectionEvidenceFiltersValid(filter:{kind?:string|undefined;marksheets:string;attention:string}):boolean{
 return filter.kind!=="IDENTITY"||filter.marksheets==="ANY"&&filter.attention!=="MISSING_MARKSHEET";
}

/** Waiting-only attention cues cannot appear in past-decision tabs. */
export function verificationWaitingAttentionValid(filter:{tab:string;attention:string}):boolean{
 return filter.tab==="WAITING"||filter.attention!=="VERIFIED_DETAILS_CHANGED"&&filter.attention!=="WAITING_OVER_WEEK";
}

/** Waiting attention cues and elapsed-age bands share one possible state/time intersection. */
export function verificationAttentionAgeCompatible(filter:{attention:string;ageBand:string;waitingState:string}):boolean{
 if(filter.attention==="WAITING_OVER_WEEK"&&(filter.ageBand==="WITHIN_48_HOURS"||filter.ageBand==="TWO_TO_SEVEN_DAYS"))return false;
 if(filter.attention==="VERIFIED_DETAILS_CHANGED"&&filter.waitingState==="SUBMITTED")return false;
 return true;
}
