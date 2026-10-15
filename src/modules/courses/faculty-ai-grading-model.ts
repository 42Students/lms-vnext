import {z} from "zod";

export const aiGradingSelectionSchema=z.object({
 assignmentId:z.string().uuid(),deliveryId:z.string().uuid(),
 submissionId:z.string().uuid().optional(),
 page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type AiGradingSelection=z.infer<typeof aiGradingSelectionSchema>;
export const aiGradingCriterionSchema=z.object({
 id:z.string().trim().min(1).max(60).regex(/^[a-zA-Z0-9_-]+$/),
 title:z.string().trim().min(2).max(120),
 description:z.string().trim().min(3).max(1200),
 maxPoints:z.number().int().min(1).max(10000),
}).strict();
export const aiGradingRubricSchema=z.object({
 title:z.string().trim().min(2).max(200),
 criteria:z.array(aiGradingCriterionSchema).min(1).max(20),
}).strict().superRefine((value,ctx)=>{
 const seen=new Set<string>();
 for(const [i,row] of value.criteria.entries()){
  if(seen.has(row.id))ctx.addIssue({code:"custom",path:["criteria",i,"id"],message:"Criterion IDs must be unique"});
  seen.add(row.id);
 }
});
export type AiGradingRubric=z.infer<typeof aiGradingRubricSchema>;
/** Only an exact assignment maximum is acceptable; rubric never changes official grading. */
export function aiGradingRubricForMaximum(raw:unknown,maximum:number):AiGradingRubric{
 const rubric=aiGradingRubricSchema.parse(raw);
 if(!Number.isInteger(maximum)||maximum<1||maximum>10000||
   rubric.criteria.reduce((sum,row)=>sum+row.maxPoints,0)!==maximum)
  throw new Error("RUBRIC_MAX_POINTS_MISMATCH");
 return rubric;
}
