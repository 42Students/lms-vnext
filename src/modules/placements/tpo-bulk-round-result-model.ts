import { z } from "zod";
import { stagePlacementRoundResultInputSchema } from "./validation";

export const bulkTpoRoundResultSchema = z.object({
  confirmed: z.literal(true),
  entries: z.array(z.object({
    expectedCurrentResultId: z.string().uuid().nullable(),
    result: stagePlacementRoundResultInputSchema,
  }).strict()).min(1).max(25).refine((entries) =>
    new Set(entries.map((item) => item.result.applicationId)).size === entries.length,
    "Duplicate application IDs are not permitted",
  ).refine((entries)=>{
    const ranks=entries.filter(item=>item.result.outcome==="HOLD").map(item=>item.result.waitlistRank);
    return new Set(ranks).size===ranks.length;
  },"Duplicate waitlist ranks are not permitted in one batch"),
}).strict();

export type TpoBulkRoundResultOutcome = {
  applicationId: string;
  status: "staged" | "ineligible";
  resultId?: string;
  reason?: string;
};

/** Summarize only confirmed persisted outcomes. No attempted row counts as saved. */
export function summarizeBulkRoundResults(
  results: readonly TpoBulkRoundResultOutcome[],
) {
  return {
    staged: results.filter((item) => item.status === "staged").length,
    ineligible: results.filter((item) => item.status === "ineligible").length,
  };
}

/** TPO-drive-workspace-41: spreadsheet paste may contain stable application IDs
 * or an exact roll number, but never guesses when the scoped roster is ambiguous.
 */
export function resolveBulkRoundLearnerTokens(
 raw:string,roster:readonly {applicationId:string;rollNumber?:string|null}[],
 max=25,
){
 if(!Number.isSafeInteger(max)||max<1||max>25||raw.length>8000)
  return {ids:[] as string[],error:"Paste 1–25 application IDs or roll numbers."};
 const tokens=[...new Set(raw.split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean))];
 if(tokens.length<1||tokens.length>max)return {ids:[] as string[],error:"Paste 1–"+max+" application IDs or roll numbers."};
 const ids:string[]=[];
 for(const token of tokens){
  const matches=roster.filter(row=>row.applicationId.toLowerCase()===token.toLowerCase()||
    row.rollNumber?.trim().toLowerCase()===token.toLowerCase());
  if(matches.length!==1)return {ids:[] as string[],error:"An application ID or roll number was missing or ambiguous in this round."};
  ids.push(matches[0]!.applicationId);
 }
 if(new Set(ids).size!==ids.length)
  return {ids:[] as string[],error:"One applicant was identified more than once."};
 return {ids,error:null};
}
