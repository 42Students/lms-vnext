import { z } from "zod";
export const bulkPlanSchema=z.object({action:z.string().min(1),scopeId:z.string().uuid(),revision:z.string().min(1),rows:z.array(z.object({id:z.string().uuid(),version:z.string().min(1)}).strict()).min(1).max(200)}).strict();
export function bulkPlanFingerprint(plan:z.infer<typeof bulkPlanSchema>){
 return JSON.stringify([plan.action,plan.scopeId,plan.revision,plan.rows.map(row=>[row.id,row.version])]);
}
export function isCurrentBulkPlan(original:z.infer<typeof bulkPlanSchema>,now:z.infer<typeof bulkPlanSchema>){
 return bulkPlanFingerprint(original)===bulkPlanFingerprint(now);
}
