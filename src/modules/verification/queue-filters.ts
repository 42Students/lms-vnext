import {z} from "zod";
export const verificationQueueFilters=z.strictObject({
  tab:z.enum(["WAITING","SENT_BACK","VERIFIED"]).default("WAITING"),
  waitingState:z.enum(["ALL","SUBMITTED","UPDATE_PENDING"]).default("ALL"),
  q:z.string().trim().max(100).default(""),
  membershipId:z.string().uuid().optional(),
  sectionId:z.string().uuid().optional(),
  kind:z.enum(["EDUCATION","IDENTITY"]).optional(),
  marksheets:z.enum(["ANY","MISSING","PRESENT"]).default("ANY"),
  attention:z.enum(["ALL","MISSING_MARKSHEET","VERIFIED_DETAILS_CHANGED","WAITING_OVER_WEEK"]).default("ALL"),
  batchId:z.string().uuid().optional(),
  branchId:z.string().uuid().optional(),
  waitingSince:z.iso.date().optional(),
  submittedFrom:z.iso.date().optional(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  sort:z.enum(["OLDEST","NEWEST"]).default("OLDEST"),
  pageSize:z.coerce.number().int().refine(value=>[10,25,50].includes(value)).default(25),
});
export type VerificationQueueFilters=z.infer<typeof verificationQueueFilters>;

/** Exact pending-state triage does not apply to already-decided tabs. */
export function verificationWaitingStateValid(filter:{tab:string;waitingState:string}):boolean {
 return filter.waitingState==="ALL"||filter.tab==="WAITING";
}
