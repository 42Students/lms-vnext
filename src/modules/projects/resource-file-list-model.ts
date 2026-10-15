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
 const scoped=records.map(record=>projectResourceFileSchema.parse(record))
  .filter(row=>row.projectId===projectId&&row.resourceId===resourceId&&row.status!=="DELETED");
 const seen=new Set<string>();
 for(const row of scoped){
  if(seen.has(row.id))throw new Error("RESOURCE_FILE_DUPLICATE_METADATA");
  seen.add(row.id);
 }
 return scoped.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||
  a.id.localeCompare(b.id));
}
