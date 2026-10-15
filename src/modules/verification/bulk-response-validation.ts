import {z} from "zod";
import type {BulkReviewOutcome} from "./bulk-outcome";
const outcomeSchema=z.strictObject({
 learnerMembershipId:z.string().uuid(),
 section:z.enum(["EDUCATION","IDENTITY"]),
 result:z.enum(["VERIFIED","SENT_BACK","STALE_VERSION","NOT_AVAILABLE","INCOMPLETE_DOCUMENTS","INVALID_TRANSITION","REASON_REQUIRED"]),
});
const receiptSchema=z.strictObject({
 summary:z.strictObject({attempted:z.number().int().nonnegative(),succeeded:z.number().int().nonnegative(),failed:z.number().int().nonnegative()}),
 outcomes:z.array(outcomeSchema).max(20),
});
/** Reject malformed, repeated, or off-selection receipts before displaying a personal decision result. */
export function parseCollegeBulkReviewReceipt(raw:unknown,selected:readonly {learnerMembershipId:string;section:string}[]):{
 summary:{attempted:number;succeeded:number;failed:number};outcomes:BulkReviewOutcome[]
}{
 const parsed=receiptSchema.parse(raw);
 const expected=new Set(selected.map(row=>row.learnerMembershipId+":"+row.section));
 const actual=new Set(parsed.outcomes.map(row=>row.learnerMembershipId+":"+row.section));
 const successes=parsed.outcomes.filter(row=>row.result==="VERIFIED"||row.result==="SENT_BACK").length;
 if(expected.size!==selected.length||actual.size!==parsed.outcomes.length||expected.size!==actual.size||
   parsed.outcomes.some(row=>!expected.has(row.learnerMembershipId+":"+row.section))||
   parsed.summary.attempted!==parsed.outcomes.length||parsed.summary.succeeded!==successes||
   parsed.summary.failed!==parsed.outcomes.length-successes)throw Error("INVALID_BULK_RECEIPT");
 return parsed;
}
