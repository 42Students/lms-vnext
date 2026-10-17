import {z} from "zod";
import {batchStudentViewSchema} from "./tpo-batch-student-view-model";
/** TPO-batches-46: a batch view is bound to one persisted cohort, not a
 * reusable all-college student view. */
export const tpoBatchSavedFilterSchema=batchStudentViewSchema.extend({
 batchId:z.string().uuid(),
}).strict();
export type TpoBatchSavedFilter=z.infer<typeof tpoBatchSavedFilterSchema>;
export const tpoBatchSavedViewCommandSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("CREATE"),name:z.string().trim().min(1).max(100),pinned:z.boolean(),filters:tpoBatchSavedFilterSchema}).strict(),
 z.object({action:z.literal("UPDATE"),id:z.string().uuid(),name:z.string().trim().min(1).max(100),pinned:z.boolean(),filters:tpoBatchSavedFilterSchema}).strict(),
 z.object({action:z.literal("DELETE"),id:z.string().uuid()}).strict(),
 z.object({action:z.literal("OPEN"),id:z.string().uuid()}).strict(),
]);
export function tpoBatchViewUrl(view:TpoBatchSavedFilter){
 const query=new URLSearchParams();
 if(view.q)query.set("q",view.q);
 if(view.classId)query.set("classId",view.classId);
 for(const field of ["decision","source","registration","order"] as const)
  if(view[field]!== "ALL"&&view[field]!=="NAME_ASC")query.set(field,view[field]);
 const base="/tpo/batches/"+encodeURIComponent(view.batchId)+"/students";
 return query.size?base+"?"+query.toString():base;
}
