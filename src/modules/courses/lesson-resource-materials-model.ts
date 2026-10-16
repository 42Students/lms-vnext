import {z} from "zod";

/** FAC-courses-14 and LEARNER-course-detail-07: canonical DB05 materials. */
export const resourceMaterialIdSchema=z.string().uuid();
export const resourceMaterialLinkSchema=z.object({
 title:z.string().trim().min(1).max(255),
 notes:z.string().trim().max(2000).nullable().default(null),
 externalUrl:z.string().url().max(2048).refine(value=>{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash;
 },"Use a credential-free HTTPS URL"),
}).strict();
export const resourceMaterialCommandSchema=z.discriminatedUnion("action",[
 resourceMaterialLinkSchema.extend({action:z.literal("ADD_LINK")}),
 resourceMaterialLinkSchema.extend({action:z.literal("EDIT_LINK"),materialId:resourceMaterialIdSchema}),
 z.object({action:z.literal("REMOVE"),materialId:resourceMaterialIdSchema}).strict(),
]);
export function resourceMaterialsWriteReady(env:NodeJS.ProcessEnv=process.env){
 return env.DB05_RESOURCE_MATERIALS_READY==="DB05_VERIFIED";
}
