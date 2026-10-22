import {z} from "zod";

export const legacyCourseBulkFlagsSchema=z.strictObject({
 courseIds:z.array(z.uuid()).min(1).max(100).refine(ids=>new Set(ids).size===ids.length,
  "Choose distinct courses"),
 active:z.boolean().nullable().optional(),
 enabled:z.boolean().nullable().optional(),
 allowedForDisplay:z.union([z.literal(0),z.literal(1),z.boolean()])
  .transform(value=>typeof value==="boolean"?(value?1:0):value)
  .nullable().optional(),
 confirmed:z.literal(true),
}).superRefine((input,ctx)=>{
 if(input.active==null&&input.enabled==null&&input.allowedForDisplay==null)
  ctx.addIssue({code:"custom",path:["active"],message:"Choose at least one course status field"});
});
export type LegacyCourseBulkFlags=z.infer<typeof legacyCourseBulkFlagsSchema>;
