import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-COMPANY-DIRECTORY-COUNT-07 global company directory's tenant-safe drive metrics",()=>{
 it("constrains BOTH count and latest activity by persisted job and relationship college",()=>{
  const service=readFileSync("src/modules/placements/admin-company-directory-service.ts","utf8");
  const count=service.slice(service.indexOf("driveCount:sql<number>"),service.indexOf("lastActiveAt:sql<Date|null>"));
  const last=service.slice(service.indexOf("lastActiveAt:sql<Date|null>"),service.indexOf("createdAt:placementCompanies.createdAt"));
  for(const query of [count,last]){
   expect(query).toContain("j.company_relationship_id = ${placementCompanyRelationships.id}");
   expect(query).toContain("j.college_id = ${colleges.id}");
  }
  expect(count).toContain("j.status != 'ARCHIVED'");
  expect(service).toContain("eq(colleges.id, selected.collegeId)");
  expect(service).toContain("eq(colleges.organizationId, selected.organizationId)");
 });
 it("keeps a disposable A/B stored-row witness in the actual PostgreSQL harness",()=>{
  const witness=readFileSync("tests/integration/chat13-super-admin-company-directory-counts-tenant.test.ts","utf8");
  expect(witness).toContain("createTenant(db,\"Company directory A\")");
  expect(witness).toContain("createTenant(db,\"Company directory B\")");
  expect(witness).toContain("company_relationship_id=$1, updated_at=$2");
  expect(witness).toContain("j.college_id=cr.college_id");
  expect(witness).toContain("expect(naive?.n).toBe(2)");
  expect(witness).toContain("expect(scoped?.n).toBe(1)");
 });
});
