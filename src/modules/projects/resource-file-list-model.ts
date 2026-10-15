import {z} from "zod";
/** Display metadata only. Storage identifiers, object keys and signed URLs are never accepted. */
export const projectResourceFileSchema=z.object({
 id:z.string().uuid(),projectId:z.string().uuid(),resourceId:z.string().uuid(),
 name:z.string().trim().min(1).max(255),bytes:z.number().int().min(0),
 contentType:z.string().trim().min(1).max(160),
 status:z.enum(["QUEUED","UPLOADING","VERIFYING","READY","QUARANTINED","FAILED","DELETED"]),
 createdAt:z.string().datetime({offset:true}),
}).strict();
export type ProjectResourceFile=z.infer<typeof projectResourceFileSchema>;
/** Client-side presentation boundary only; an authenticated server must enforce access independently. */
export function filesForProjectResource(projectId:string,resourceId:string,records:readonly unknown[]){
 z.string().uuid().parse(projectId);z.string().uuid().parse(resourceId);
 const seen=new Set<string>();
 return records.map(record=>projectResourceFileSchema.parse(record))
  .filter(row=>row.projectId===projectId&&row.resourceId===resourceId&&row.status!=="DELETED")
  .filter(row=>{if(seen.has(row.id))return false;seen.add(row.id);return true;})
  .sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
}
