import {z} from "zod";
import {confirmedTpoRoundResultSchema} from "./tpo-confirmed-round-result-model";
export const tpoRoundResultEntryFormSchema=z.object({
 applicationId:z.uuid(),expectedCurrentResultId:z.uuid().nullable(),
 outcome:z.enum(["PASS","FAIL","HOLD","ABSENT"]),
 note:z.string().trim().min(1).max(1000),waitlistRank:z.string().trim(),
}).strict().transform((value):z.input<typeof confirmedTpoRoundResultSchema>=>({
 confirmed:true as const,expectedCurrentResultId:value.expectedCurrentResultId,
 result:{applicationId:value.applicationId,outcome:value.outcome,
  ...(value.outcome==="HOLD"?{waitlistRank:Number(value.waitlistRank)}:{}),
  ...(value.outcome==="PASS"?{internalComment:value.note}:{candidateMessage:value.note})},
})).pipe(confirmedTpoRoundResultSchema);
