import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoGeneralReviewQuerySchema} from "@/modules/placements/tpo-general-request-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO general request paged queue contract",()=>{
 it("defaults to pending, bounds page sizes and rejects unknown client status",()=>{
  expect(tpoGeneralReviewQuerySchema.parse({})).toEqual({page:1,pageSize:25,status:"PENDING",kind:"ALL",q:""});
  expect(tpoGeneralReviewQuerySchema.parse({page:"3",pageSize:"50",status:"ALL"}))
   .toMatchObject({page:3,pageSize:50,status:"ALL"});
  for(const input of [{page:0},{pageSize:1000},{page:"not-number"},
    {status:"ADMIN"},{kind:"INVALID"},{q:"x"},{page:1,collegeId:"foreign"}]){
   expect(tpoGeneralReviewQuerySchema.safeParse(input).success).toBe(false);
  }
 });
 it("count, paged rows and tenant scope are server-authoritative, not a 1000-item client slice",()=>{
  const service=src("src/modules/placements/tpo-general-request-service.ts");
  const start=service.indexOf("export async function listTpoGeneralRequests(ctx:");
  const stop=service.indexOf("/** Unsupported effects",start);
  const body=service.slice(start,stop);
  expect(body).toContain("await requireTpo(ctx)");
  expect(body).toContain("eq(placementLearnerGeneralRequests.collegeId,college.id)");
  expect(body).toContain("filter.status");
  expect(body).toContain(".limit(filter.pageSize).offset((filter.page-1)*filter.pageSize)");
  expect(body).toContain("totalPages:");
  expect(body).not.toContain(".limit(1000)");
 });
 it("rejects duplicate filters and preserves no-store scoped responses",()=>{
  const route=src("src/app/api/placements/tpo/requests/general/route.ts");
  expect(route).toContain("params.getAll(key).length>1");
  expect(route).toContain("Unknown review filter");
  expect(route).toContain("tpoGeneralReviewQuerySchema.safeParse");
  expect(route).toContain("listTpoGeneralRequests(await getCurrentRequestContext(),parsed.data)");
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
 it("disables stale destructive actions, avoids out-of-order refresh, and exposes next/history",()=>{
  const panel=src("src/components/placements/tpo-general-requests-panel.tsx");
  expect(panel).toContain("const sequence=++generation.current;");
  expect(panel).toContain("if(sequence!==generation.current)return false;");
  expect(panel).toContain("setStale(true)");
  expect(panel).toContain("disabled={loading||stale||pending}");
  expect(panel).toContain('onReviewed={load} disabled={loading||stale||pending}');
  expect(panel).toContain('value="PENDING">Waiting');
  expect(panel).toContain('value="ALL">All history');
  expect(panel).toContain('aria-label="Other request history pages"');
  expect(panel).toContain("setPage(data.totalPages)");
 });
});
