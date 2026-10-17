import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoAudiencePreviewQuery,announcementPreviewScope} from "@/modules/announcements/tpo-audience-preview-query";
import {tpoNoticeCreateSchema} from "@/modules/announcements/tpo-placement-write-service";
const src=(p:string)=>readFileSync(p,"utf8");
const first="10000000-0000-4000-8000-000000000001";
const second="10000000-0000-4000-8000-000000000002";
describe("TPO announcement targeting",()=>{
 it("TPO-inbox-team-44 selects multiple persisted cohorts/branches without inventing audience IDs",()=>{
  for(const audience of ["BATCHES","BRANCHES"] as const){
   const parsed=tpoAudiencePreviewQuery.safeParse({audience,targetIds:[first,second]});
   expect(parsed.success).toBe(true);
   const scope=announcementPreviewScope({audience,targetIds:[first,second]});
   if(!scope)throw Error("Expected scoped audience");
   expect(scope.kind).toBe(audience);
   expect(audience==="BATCHES"&&scope.kind==="BATCHES"?scope.cohortIds:
    scope.kind==="BRANCHES"?scope.departmentIds:[]).toEqual([first,second]);
   expect(tpoAudiencePreviewQuery.safeParse({audience,targetIds:[first,first]}).success).toBe(false);
   expect(tpoAudiencePreviewQuery.safeParse({audience,targetIds:[]}).success).toBe(false);
   expect(tpoAudiencePreviewQuery.safeParse({audience,targetIds:[first],targetId:second}).success).toBe(false);
  }
 });
 it("TPO-inbox-team-44 saves exact selected audience groups with a frozen per-recipient snapshot",()=>{
  const base={title:"Talk",message:"Join the talk",pinned:false};
  expect(tpoNoticeCreateSchema.safeParse({...base,audience:"BATCHES",targetIds:[first,second]}).success).toBe(true);
  expect(tpoNoticeCreateSchema.safeParse({...base,audience:"BRANCHES",targetIds:[first,second]}).success).toBe(true);
  expect(tpoNoticeCreateSchema.safeParse({...base,audience:"COLLEGE",targetIds:[first]}).success).toBe(false);
  const service=src("src/modules/announcements/tpo-placement-write-service.ts");
  expect(service).toContain("freezeTpoNoticeRecipients");
  expect(service).toContain("targetIds:data.targetIds");
  expect(service).toContain("tx.insert(placementTpoNoticeRecipients)");
  const query=src("src/modules/announcements/tpo-targeted-recipient-query.ts");
  expect(query).toContain("e.cohort_id IN (${targetSql})");
  expect(query).toContain("d.id IN (${targetSql})");
  expect(query).toContain("ORDER BY m.id LIMIT 100001");
 });
 it("TPO-inbox-team-44 lets users search multiple batches/branches and preserves selection through preview",()=>{
  const picker=src("src/components/tpo/tpo-notice-audience-picker.tsx");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  const route=src("src/app/api/placements/tpo/announcements/route.ts");
  expect(picker).toContain('multiple value={targets}');
  expect(picker).toContain('name="targetIds"');
  expect(picker).toContain("Ctrl or Cmd to choose more.");
  expect(page).toContain("initialTargets={query.success?query.data.targetIds??[]:[]}");
  expect(page).toContain("query.data.targetIds?.map(id");
  expect(route).toContain('form.getAll("targetIds")');
  for(const text of ["No batch is in placements","No student in placements has a branch yet","No published drive yet"])
   expect(picker).toContain(text);
 });
});