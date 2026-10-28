import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoOwnGeneralRequestQuerySchema} from "@/modules/placements/tpo-general-request-model";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("learner's bounded general-request history",()=>{
 it("accepts a bounded pagination contract with explicit defaults",()=>{
  expect(tpoOwnGeneralRequestQuerySchema.parse({})).toEqual({page:1,pageSize:20});
  expect(tpoOwnGeneralRequestQuerySchema.parse({page:"2",pageSize:"50"}))
   .toEqual({page:2,pageSize:50});
  for(const invalid of [{page:"0"},{page:"-1"},{page:"1.5"},{page:"10001"},
   {pageSize:"9"},{pageSize:"51"},{page:"anything"},{collegeId:"another-college"}]){
   expect(tpoOwnGeneralRequestQuerySchema.safeParse(invalid).success).toBe(false);
  }
 });
 it("keeps count and page membership/tenant scoped, ordered and bounded",()=>{
  const service=source("src/modules/placements/tpo-general-request-service.ts");
  const start=service.indexOf("export async function listOwnTpoGeneralRequestsPage(");
  const end=service.indexOf("export async function listTpoGeneralRequests(",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const part=service.slice(start,end);
  expect(part).toContain("await requireLearner(ctx)");
  expect(part).toContain("await requireRegistered()");
  expect(part).toContain("eq(placementLearnerGeneralRequests.collegeId,member.collegeId)");
  expect(part).toContain("eq(placementLearnerGeneralRequests.membershipId,member.id)");
  expect(part).toContain(".where(predicate)");
  expect(part).toContain(".limit(filter.pageSize).offset((filter.page-1)*filter.pageSize)");
  expect(part).toContain("desc(placementLearnerGeneralRequests.id)");
  expect(part).toContain("totalPages:Math.max(1,Math.ceil(total/filter.pageSize))");
 });
 it("rejects unknown or repeated HTTP filters and returns private no-store history",()=>{
  const route=source("src/app/api/placements/requests/general/route.ts");
  expect(route).toContain('params.getAll(key).length>1');
  expect(route).toContain("tpoOwnGeneralRequestQuerySchema.safeParse");
  expect(route).toContain("listOwnTpoGeneralRequestsPage(ctx,filter.data)");
  expect(route).toContain('"Cache-Control":"private, no-store"');
  expect(route).toContain("isSameOriginRequest(request)");
 });
 it("renders paging, retry, and returns to newest history after send",()=>{
  const ui=source("src/components/placements/learner-general-requests.tsx");
  expect(ui).toContain('aria-label="Your request history pages"');
  expect(ui).toContain('historyTotalPages');
  expect(ui).toContain('historyError');
  expect(ui).toContain('onClick={()=>void refresh(historyPage)}');
  expect(ui).toContain('if(historyPage===1)await refresh(1)');
  expect(ui).toContain('else setHistoryPage(1)');
 });
});
