import {z} from "zod";
/** PR-S2-07 proposed final delivery revisions. Persistence is not registered. */
export const projectDeliveryAttachmentSchema=z.object({
  name:z.string().trim().min(1).max(255),
  kind:z.enum(["FILE","LINK"]),
  fileId:z.string().uuid().nullable(),
  url:z.url().nullable(),
}).strict().refine(value=>value.kind==="FILE"?Boolean(value.fileId):Boolean(value.url),{
  message:"File or link is required",
});
export const projectDeliveryLockInputSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  reason:z.string().trim().min(1).max(4000),
}).strict();
export function mayReopenApprovedDelivery(projectStatus:string,hasEvaluation:boolean){
  // An evaluated or already completed delivery must never be silently unlocked.
  return projectStatus==="ACTIVE"&&!hasEvaluation;
}
