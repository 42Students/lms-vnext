import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoBatchSavedViewCommandSchema,tpoBatchViewUrl} from "@/modules/placements/tpo-batch-saved-view-model";
const src=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
const batch="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
describe("TPO-batches-46 batch-scoped saved student views",()=>{
 it("TPO-batches-46 accepts only named batch-owned saved view state",()=>{
  const filters={batchId:batch,q:"Asha",decision:"ELIGIBLE",source:"ALL",registration:"ALL",order:"NAME_ASC"};
  expect(tpoBatchSavedViewCommandSchema.safeParse({action:"CREATE",name:"Eligibility",filters,pinned:true}).success).toBe(true);
  expect(tpoBatchSavedViewCommandSchema.safeParse({action:"CREATE",name:"",filters,pinned:true}).success).toBe(false);
  expect(tpoBatchSavedViewCommandSchema.safeParse({action:"UPDATE",id:other,name:"test",filters:{...filters,decision:"DROP"},pinned:false}).success).toBe(false);
  expect(tpoBatchViewUrl(filters as Parameters<typeof tpoBatchViewUrl>[0])).toContain("/tpo/batches/"+batch+"/students?");
 });
 it("TPO-batches-46 enforces persisted college, user and BATCH_STUDENTS scope, five pins and a saved filter's cohort identity",()=>{
  const service=src("src/modules/placements/tpo-batch-saved-view-service.ts");
  for(const guard of ['eq(placementTpoSavedViews.scope,"BATCH_STUDENTS")',
   'eq(placementTpoSavedViews.userId,ctx.user.id)',
   "parseStored(row.filters,batchId)","input.filters.batchId!==batchId",
   "assertPersistedPlatformPermission","if(input.pinned&&pins>=5)","getTpoBatch(ctx,batchId)"])
   expect(service).toContain(guard);
 });
 it("TPO-batches-46 exposes signed-in GET and same-origin POST, with pin/open/update/export controls",()=>{
  const route=src("src/app/api/placements/tpo/batches/[batchId]/saved-views/route.ts");
  const ui=src("src/components/tpo/tpo-batch-student-saved-views.tsx");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("listTpoBatchSavedViews(await getCurrentRequestContext(),batchId)");
  for(const label of ["Pin view","Save current filters","Update selected","Download CSV","Delete","Open"])
   expect(ui).toContain(label);
  const page=src("src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx");
  expect(page).toContain("<TpoBatchStudentSavedViews batchId={batchId}/>");
 });
});
