import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoGeneralReviewQuerySchema} from "@/modules/placements/tpo-general-request-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO server-scoped general request filters",()=>{
 it("rejects unsupported kinds, unknown college IDs, and broad one-letter probes",()=>{
  expect(tpoGeneralReviewQuerySchema.safeParse({kind:"OTHER"}).success).toBe(false);
  expect(tpoGeneralReviewQuerySchema.safeParse({q:"a"}).success).toBe(false);
  expect(tpoGeneralReviewQuerySchema.safeParse({q:"a".repeat(101)}).success).toBe(false);
  expect(tpoGeneralReviewQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
  expect(tpoGeneralReviewQuerySchema.safeParse({kind:"ABSENCE_DISPUTE",q:"  Bob  "}).data)
   .toMatchObject({kind:"ABSENCE_DISPUTE",q:"Bob"});
 });
 it("applies the same membership/user joins and predicate to count and rows",()=>{
  const code=src("src/modules/placements/tpo-general-request-service.ts");
  const body=code.slice(code.indexOf("export async function listTpoGeneralRequests(ctx:"),
   code.indexOf("/** Unsupported effects"));
  expect(body.match(/\.innerJoin\(collegeMemberships/g)?.length).toBe(2);
  expect(body.match(/\.innerJoin\(users/g)?.length).toBe(2);
  expect(body.match(/\.where\(scoped\)/g)?.length).toBe(2);
  expect(body.match(/getDb\(\)\.select\(\{count:sql<number>/g)?.length).toBe(1);
  expect(body).toContain("const [totalRows,requests]=await Promise.all([");
  expect(body).toContain('filter.kind==="ALL"?undefined');
  expect(body).toContain("filter.q.replace(");
  expect(body).toContain("ilike(users.displayName");
  expect(body).toContain("ilike(placementLearnerGeneralRequests.reason");
  expect(body).toContain("eq(placementLearnerGeneralRequests.collegeId,college.id)");
 });
 it("supports user-confirmed search, resets and blocks stale decisions on filter change",()=>{
  const route=src("src/app/api/placements/tpo/requests/general/route.ts");
  const panel=src("src/components/placements/tpo-general-requests-panel.tsx");
  expect(route).toContain('["page","pageSize","status","kind","q"]');
  expect(route).toContain("params.getAll(key).length>1");
  expect(panel).toContain('query.set("q",searchQuery)');
  expect(panel).toContain('role="search"');
  expect(panel).toContain('value="ABSENCE_DISPUTE"');
  expect(panel).toContain('onReviewed={load} disabled={loading||stale||pending}');
 });
});
