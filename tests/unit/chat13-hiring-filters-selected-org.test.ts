import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const mocks=vi.hoisted(()=>({getDb:vi.fn(),requireSelected:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/admin-ui/super-admin-selected-college",()=>({
 requireSuperAdminSelectedCollege:mocks.requireSelected,
}));
import {getSuperAdminHiringReportFilters} from "@/modules/admin-ui/super-admin-hiring-report-filters-service";

describe("SA-HIRING-FILTER-ORG-21 persisted organization must own selected college",()=>{
 const scope={collegeId:"11111111-1111-4111-8111-111111111111",
  organizationId:"22222222-2222-4222-8222-222222222222"};
 beforeEach(()=>{mocks.getDb.mockReset();mocks.requireSelected.mockReset();
  mocks.requireSelected.mockReturnValue(scope);});
 it("denies a mismatched parent before reading any private facet labels",async()=>{
  const select=vi.fn(()=>({
   from(){return this;},where(){return this;},
   limit(){return Promise.resolve([]);},
  }));
  mocks.getDb.mockReturnValue({select});
  await expect(getSuperAdminHiringReportFilters({} as never))
   .rejects.toThrow("Missing permission: placements.read");
  expect(select).toHaveBeenCalledTimes(1);
  expect(mocks.requireSelected).toHaveBeenCalledWith(
   expect.anything(),"placements.read");
 });
 it("uses the same selected organization guard before the four college facets",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-hiring-report-filters-service.ts","utf8");
  expect(source).toContain("eq(colleges.id,scope.collegeId)");
  expect(source).toContain("eq(colleges.organizationId,scope.organizationId)");
  expect(source.indexOf("if(!college)throw new AuthorizationError"))
   .toBeLessThan(source.indexOf("Promise.all(["));
  expect(source).toContain("eq(placementJobs.collegeId,scope.collegeId)");
  expect(source).toContain("eq(departments.collegeId,scope.collegeId)");
 });
});
