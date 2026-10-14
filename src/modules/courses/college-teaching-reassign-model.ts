import {z} from "zod";
const uuid=z.string().uuid();
export const collegeTeachingReassignSchema=z.strictObject({
  expectedMembershipId:uuid,
  replacementMembershipId:uuid,
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirm:z.literal(true),
}).refine(x=>x.expectedMembershipId!==x.replacementMembershipId,{
  path:["replacementMembershipId"],message:"Choose a different Faculty membership",
});
export const collegeTeachingReassignIdSchema=uuid;
/** A still-valid request context cannot authorize a revoked persisted account. */
export function teachingMembershipIsActive(row: {
  accountStatus: string; membershipStatus: string;
} | undefined): boolean {
  return row?.accountStatus === "ACTIVE" && row.membershipStatus === "ACTIVE";
}
export type TeachingScheduleWindow = {id:string;startsAt:Date;endsAt:Date};
/** Adjacent sessions are allowed; the delivery's own session is not a second
 * booking. Persisted future windows, rather than UI workload counts, decide. */
export function teachingScheduleConflict(
  target:readonly TeachingScheduleWindow[],busy:readonly TeachingScheduleWindow[],
): boolean {
  return target.some(session=>busy.some(existing=>session.id!==existing.id&&
    session.startsAt.getTime()<existing.endsAt.getTime()&&
    existing.startsAt.getTime()<session.endsAt.getTime()));
}
export function teachingReassignPrompt(from:string,to:string,role:string){
  return `Replace ${from} with ${to} as ${role}? Teaching history is retained and this change is audited.`;
}
