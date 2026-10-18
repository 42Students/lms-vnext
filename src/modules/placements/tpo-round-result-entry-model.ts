import {z} from "zod";
import {confirmedTpoRoundResultSchema} from "./tpo-confirmed-round-result-model";
export const tpoRoundResultEntryFormSchema=z.object({
 applicationId:z.uuid(),expectedCurrentResultId:z.uuid().nullable(),
 outcome:z.enum(["PASS","FAIL","HOLD","ABSENT"]),
 note:z.string().trim().min(1).max(1000),waitlistRank:z.string().trim(),
}).strict().superRefine((value,ctx)=>{
 // TPO-drive-workspace-40: displayed waitlist rank is a positive decimal
 // integer, never exponent/hex notation or an invisible fractional coercion.
 if(value.outcome==="HOLD"&&!/^[1-9][0-9]{0,5}$/.test(value.waitlistRank))
  ctx.addIssue({code:"custom",path:["waitlistRank"],message:"Enter a positive whole-number waitlist rank"});
 if(value.outcome!=="HOLD"&&value.waitlistRank!=="")
  ctx.addIssue({code:"custom",path:["waitlistRank"],message:"Only waitlisted learners may have a rank"});
}).transform((value):z.input<typeof confirmedTpoRoundResultSchema>=>({
 confirmed:true as const,expectedCurrentResultId:value.expectedCurrentResultId,
 result:{applicationId:value.applicationId,outcome:value.outcome,
  ...(value.outcome==="HOLD"?{waitlistRank:Number(value.waitlistRank)}:{}),
  ...(value.outcome==="PASS"?{internalComment:value.note}:{candidateMessage:value.note})},
})).pipe(confirmedTpoRoundResultSchema);
