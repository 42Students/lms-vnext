import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");
const ledger=src("docs/audit/coverage/chat6-admin-middle-third-ledger.md");
const routes=[...ledger.matchAll(/^\|\s*(?:[3-6]\d|7[0-4])\s*\|\s*`(\/admin\/[^ `]+)`/gm)].map(m=>m[1]);
const fileFor=(route:string)=>"src/app/(authenticated)"+route+"/page.tsx";

describe("SA-admin-middle-route-01: exact second third entrypoint authorization audit",()=>{
 it("has the complete nonduplicate 37-route second-third inventory",()=>{
  expect(routes).toHaveLength(37);
  expect(new Set(routes).size).toBe(routes.length);
  expect(routes[0]).toBe("/admin/inbound-mail");
  expect(routes.at(-1)).toBe("/admin/placements/seasons/[seasonId]");
 });
 for(const route of routes){
  it(route+" delegates rendering to a real authenticated context and scoped loader",()=>{
    const page=src(fileFor(route));
    expect(page).toMatch(/export default (async )?function|export \{ default \}/);
    const hasLocalContext=page.includes("getCurrentRequestContext()");
    const delegated=page.includes("SuperAdminContentDirectoryPage");
    expect(hasLocalContext||delegated,route+" lacks authenticated context").toBe(true);
    if(delegated){
      const shared=src("src/components/courses/super-admin-content-directory-page.tsx");
      expect(shared).toContain("getCurrentRequestContext()");
      expect(shared).toContain("if(!context.adminScope?.collegeId)");
      expect(shared).toContain("adminContentQuerySchema");
    }
    // Every data-bearing page passes the actual request context into a
    // permission-checking service or a selected-college scoped shared page.
    if(page.includes("<AdminScopedReadPage")){
      const shared=src("src/components/admin/admin-scoped-read-page.tsx");
      expect(shared).toContain("readAdminQuery(await searchParams)");
      expect(shared).toContain("if(!context.adminScope?.collegeId)");
      expect(shared).toContain("await loader(parsed.data)");
    }
    if(route.includes("[") && !route.includes("/jobs/[jobId]/")){
      expect(page).toContain("params");
      expect(page).toMatch(/notFound|getPlacement|ReadPage|service/i);
    }
  });
 }
 it("SA-admin-middle-route-02 keeps platform admin candidate application lists college-scoped",()=>{
  const service=src("src/modules/admin-ui/super-admin-placement-offers-service.ts");
  expect(service).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
  expect(service).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
  expect(service).toContain("eq(placementJobs.collegeId,scope.collegeId)");
  const scope=src("src/modules/admin-ui/super-admin-selected-college.ts");
  expect(scope).toContain("if(!isSuperAdmin(context)||!selected?.collegeId)");
  expect(scope).toContain("requirePermission(context,permission");
 });
 it("SA-admin-middle-route-03 private inbound-mail never resolves to a send action",()=>{
  const page=src("src/app/(authenticated)/admin/inbound-mail/page.tsx");
  expect(page).toContain('requirePermission(context,"admin-scope.select")');
  expect(page).toContain("listInboundMailForAdmin(context,parsed.data)");
  expect(page).toContain("Private incoming messages.");
  expect(page).not.toContain("sendEmail(");
 });
 it("SA-admin-middle-route-04 deep-linked class move uses audited same-period capacity checks",()=>{
  const page=src("src/app/(authenticated)/admin/people/directory/page.tsx");
  expect(page).toContain("getCurrentRequestContext()");
  const roster=src("src/components/admin/super-admin-batch-roster-manager.tsx");
  expect(roster).toContain("target.learnerCount>=target.capacity");
  expect(roster).toContain("current.academicPeriodId!==target.academicPeriodId");
  expect(roster).toContain("const pendingRef=useRef(false)");
 });
});