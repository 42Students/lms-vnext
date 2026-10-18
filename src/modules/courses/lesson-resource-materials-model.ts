import {z} from "zod";

/** FAC-courses-14 and LEARNER-course-detail-07: canonical DB05 materials. */
export const resourceMaterialIdSchema=z.string().uuid();
export const resourceMaterialLinkSchema=z.object({
 title:z.string().trim().min(1).max(255),
 notes:z.string().trim().max(2000).nullable().default(null),
 externalUrl:z.string().url().max(2048).refine(value=>{
  // Zod 4 runs field refinements during safeParse even if an earlier URL
  // check failed. Invalid user input must return a validation error, not throw.
  try{
   const url=new URL(value);
   const host=url.hostname.toLowerCase();
   const internal=host==="localhost"||host.endsWith(".localhost")||
    host==="0.0.0.0"||host==="[::1]"||host==="[::]"||
    /^127\./.test(host)||/^10\./.test(host)||
    /^192\.168\./.test(host)||/^169\.254\./.test(host)||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(host);
   return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash&&!internal;
  }catch{
   return false;
  }
 },"Use a credential-free HTTPS URL"),
}).strict();
/** Sanitize legacy-stored material links before they reach a learner browser.
 * Authoring validation alone cannot protect old/imported database rows. */
export function safeLearnerResourceMaterialHref(input:string|null|undefined):string|null{
 if(typeof input!=="string")return null;
 const parsed=resourceMaterialLinkSchema.safeParse({
  title:"Material",notes:null,externalUrl:input,
 });
 return parsed.success?parsed.data.externalUrl:null;
}

export const resourceMaterialCommandSchema=z.discriminatedUnion("action",[
 resourceMaterialLinkSchema.extend({action:z.literal("ADD_LINK")}),
 resourceMaterialLinkSchema.extend({action:z.literal("EDIT_LINK"),materialId:resourceMaterialIdSchema}),
 z.object({action:z.literal("REMOVE"),materialId:resourceMaterialIdSchema}).strict(),
]);
export function resourceMaterialsWriteReady(env:NodeJS.ProcessEnv=process.env){
 return env.DB05_RESOURCE_MATERIALS_READY==="DB05_VERIFIED";
}
