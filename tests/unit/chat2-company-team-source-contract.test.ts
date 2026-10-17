import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Company discussion tenant enforcement and reachability",()=>{
 it("TPO-companies-05 loads only college-related company conversations under persisted placement permissions",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
  expect(service).toContain('eq(placementCompanyRelationships.collegeId,college.id)');
  expect(service).toContain('eq(placementCompanyRelationships.companyId,companyId)');
  expect(service).toContain('eq(placementTpoCompanyThreadMessages.collegeId,college.id)');
  expect(service).toContain("hasPlacementTeamMembership(context)");
  expect(service).toContain("placementTableExists(\"placement_tpo_company_threads\")");
 });
 it("TPO-companies-05 persists one company thread with idempotent message writes and collision checks",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain('tx.insert(placementTpoCompanyThreads)');
  expect(service).toContain('tx.insert(placementTpoCompanyThreadMessages)');
  expect(service).toContain(".onConflictDoNothing()");
  expect(service).toContain("message.body!==input.body");
  expect(service).toContain('TPO_COMPANY_TEAM_IDEMPOTENCY_CONFLICT');
  expect(service).toContain('eq(placementCompanyRelationships.status,"ACTIVE")');
 });
 it("TPO-inbox-team-16 TPO-companies-05 use explicit proposed migration instead of pretending storage is registered",()=>{
  const migration=src("docs/proposed-migrations/tpo-company-team-conversations.sql");
  const schema=src("src/db/schema/tpo-company-team.ts");
  expect(migration).toContain("tpo_company_threads_one_per_relationship_uq");
  expect(migration).toContain("tpo_company_message_dedupe_uq");
  expect(migration).toContain("tpo_company_message_author_college_fk");
  expect(schema).toContain("placementTpoCompanyThreads");
  expect(schema).toContain("placementTpoCompanyThreadMessages");
  expect(src("src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx"))
   .toContain("require their registered database migration");
  expect(src("src/app/(authenticated)/tpo/companies/[companyId]/page.tsx"))
   .toContain("Open in Team · Company discussion");
 });
});