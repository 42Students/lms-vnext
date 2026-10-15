import {expect,it} from "vitest";
import {filesForProjectResource} from "@/modules/projects/resource-file-list-model";
const projectId="11111111-1111-4111-8111-111111111111";
const resourceId="22222222-2222-4222-8222-222222222222";
const id="33333333-3333-4333-8333-333333333333",newer="44444444-4444-4444-8444-444444444444";
const file={id,projectId,resourceId,name:"guide.pdf",bytes:100,contentType:"application/pdf",status:"READY" as const,createdAt:"2026-10-15T12:00:00+05:30"};
it("refuses two live versions of the same file rather than hiding a conflict",()=>{
 expect(()=>filesForProjectResource(projectId,resourceId,[file,{...file,name:"changed.pdf"}])).toThrow("RESOURCE_FILE_DUPLICATE_METADATA");
});
it("sorts by actual UTC instants rather than ISO offsets",()=>{
 const rows=filesForProjectResource(projectId,resourceId,[file,
  {...file,id:newer,createdAt:"2026-10-15T07:00:00Z"}]);
 expect(rows.map(x=>x.id)).toEqual([newer,id]);
});
