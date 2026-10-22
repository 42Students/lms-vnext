import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("super admin lecture halls scope and legacy browse",()=>{
 const service=readFileSync("src/modules/academics/lecture-hall-service.ts","utf8");
 const page=readFileSync("src/app/(authenticated)/admin/lecture-halls/page.tsx","utf8");
 it("never widens mutation scope when browsing an organization",()=>{
  expect(service).toContain("listSuperAdminOrganizationLectureHalls(");
  expect(service).toContain('(context.adminScope?.organizationId??undefined)!==query.organizationId');
  expect(service).toContain('context.adminScope?.collegeId');
  expect(service).toContain('requirePermission(context,"academics.read",');
  expect(service).toContain('query.organizationId?{organizationId:query.organizationId}:{}');
  expect(service).toContain('query.organizationId?eq(colleges.organizationId,query.organizationId):undefined');
  expect(service).toContain('eq(colleges.status,"ACTIVE")');
  expect(service).toContain('eq(lectureHalls.collegeId, college.id)');
 });
 it("keeps organization results read-only, bounded and in this tab",()=>{
  expect(service).toContain('limit:z.number().int().min(1).max(100).default(20)');
  expect(page).toContain('aria-label="Organization lecture halls"');
  expect(page).toContain("Read-only rooms across this organization");
  expect(page).toContain('href={"/admin/lecture-halls?"');
  expect(page).not.toContain('target="_blank"');
 });
});
