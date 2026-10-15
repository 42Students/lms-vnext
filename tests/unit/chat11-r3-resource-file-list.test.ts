import {expect,it} from "vitest";
import {filesForProjectResource,projectResourceFileSchema} from "@/modules/projects/resource-file-list-model";
const project="11111111-1111-4111-8111-111111111111",resource="22222222-2222-4222-8222-222222222222",other="33333333-3333-4333-8333-333333333333";
const file={id:"44444444-4444-4444-8444-444444444444",projectId:project,resourceId:resource,name:"research.pdf",bytes:200,contentType:"application/pdf",status:"READY",createdAt:"2026-10-15T09:00:00Z"};
it("lists metadata only for the exact parent project and resource, excluding deleted rows",()=>{
 expect(filesForProjectResource(project,resource,[file,{...file,id:other,resourceId:other},{...file,id:other,status:"DELETED"}])).toEqual([file]);
});
it("rejects download URLs and storage keys in the presentation payload",()=>{
 expect(projectResourceFileSchema.safeParse({...file,storageKey:"bucket/private"}).success).toBe(false);
 expect(projectResourceFileSchema.safeParse({...file,downloadUrl:"https://private.example"}).success).toBe(false);
});
it("refuses malformed metadata rather than projecting it",()=>{
 expect(()=>filesForProjectResource(project,resource,[{...file,bytes:-1}])).toThrow();
});
