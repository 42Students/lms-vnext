import {describe,expect,it} from "vitest";
import {adminCompaniesQuerySchema,GLOBAL_COMPANY_PAGE_SIZE} from "@/modules/placements/admin-company-directory-model";
import {readFileSync} from "node:fs";

describe("W1_lane6_21: canonical global companies",()=>{
 it("rejects cross-college selectors on the global source and pages by canonical company IDs",()=>{
  const src=readFileSync("src/modules/placements/admin-company-directory-service.ts","utf8");
  expect(src).toContain("export async function listSuperAdminGlobalCompanyCatalogue(");
  expect(src).toContain("context.adminScope?.collegeId");
  expect(src).toContain("query.collegeId");
  expect(src).toContain("from(placementCompanies).where(filter)");
  expect(src).toContain("orderBy(...(query.sort");
  expect(src).toContain("limit(GLOBAL_COMPANY_PAGE_SIZE).offset((query.page-1)*GLOBAL_COMPANY_PAGE_SIZE)");
  expect(GLOBAL_COMPANY_PAGE_SIZE).toBe(50);
  expect(adminCompaniesQuerySchema.safeParse({page:"0"}).success).toBe(false);
 });
 it("aggregates all active relationships/jobs across colleges without duplicate canonical identities",()=>{
  const src=readFileSync("src/modules/placements/admin-company-directory-service.ts","utf8");
  expect(src).toContain("count(distinct r.college_id)::int");
  expect(src).toContain("r.archived_at is null");
  expect(src).toContain("j.archived_at is null");
  expect(src).toContain("r.status='ACTIVE'");
  expect(src).toContain("max(j.updated_at)");
 });
});
