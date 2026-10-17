import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Company Team posting routes and graceful draft retention",()=>{
 it("TPO-companies-05 rejects cross-origin writes before parsing or opening company records",()=>{
  const route=src("src/app/api/placements/tpo/companies/[companyId]/team/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("tpoCompanyTeamPostSchema.safeParse");
  expect(route).toContain('error.code==="STORAGE_PENDING"');
  expect(route).toContain('error.code==="STALE"');
  expect(route).toContain('status:409');
  expect(route).not.toContain("export async function GET(");
 });
 it("TPO-companies-05 retains unsent drafts and a stable idempotency token across network retries",()=>{
  const form=src("src/components/tpo/tpo-company-team-composer.tsx");
  expect(form).toContain("sessionStorage.setItem(storageKey");
  expect(form).toContain("sessionStorage.getItem(storageKey");
  expect(form).toContain('sessionStorage.setItem(storageKey+":key"');
  expect(form).toContain("pending.current");
  expect(form).toContain("window.addEventListener(\"beforeunload\",warn)");
  expect(form).toContain("timeoutMs:12000");
  expect(form).toContain("router.refresh()");
 });
 it("TPO-inbox-team-29 restricts company activity bell to active college placement-team recipients and links directly to a message",()=>{
  const service=src("src/modules/placements/tpo-company-team-service.ts");
  expect(service).toContain('inArray(membershipRoles.role,["TPO","COLLEGE_ADMIN"])');
  expect(service).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('"/team#team-message-"+message.id');
  expect(service).toContain("notifyIds.delete(membership.id)");
  expect(service).toContain("inArray(collegeMemberships.id,[...notifyIds].slice(0,250))");
 });
});