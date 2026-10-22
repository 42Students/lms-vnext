import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {parseAdminSessionHistoryPage} from "@/modules/colleges/admin-session-query-model";
const base="src/app/(authenticated)/admin/colleges/[collegeId]";
const read=(path:string)=>readFileSync(join(process.cwd(),base+"/"+path),"utf8");
describe("chat-4 Super Admin tenant audit: every college admin route scopes reads and actions",()=>{
  const routes=[
    "page.tsx","admins/page.tsx","admins/[userId]/page.tsx","admins/[userId]/history/page.tsx",
    "branding/page.tsx","readiness/page.tsx","signin/page.tsx","subdomain/page.tsx","verification/page.tsx",
  ];
  for(const path of routes){
    it(path+" checks caller scope before presenting college-specific operations",()=>{
      const s=read(path);
      expect(s).toContain("getCurrentRequestContext()");
      expect(s).toContain("collegeId");
      expect(s).toContain("PageHeader");
      if(path==="subdomain/page.tsx")expect(s).toContain("<PageBackLink");
      else expect(s).toContain("min-h-11");
    });
  }
  it("history filter parser never picks the first duplicate value or accepts foreign keys",()=>{
    expect(parseAdminSessionHistoryPage({})).toBe(1);
    expect(parseAdminSessionHistoryPage({page:"5"})).toBe(5);
    for(const bad of [{page:["1","2"]},{page:"0"},{page:"1.5"},{page:"10001"},
      {collegeId:"other"},{page:"NaN"}])
      expect(parseAdminSessionHistoryPage(bad)).toBeNull();
    expect(read("admins/[userId]/history/page.tsx")).toContain("parseAdminSessionHistoryPage(raw)");
    expect(read("admins/[userId]/history/page.tsx")).toContain("<ErrorState");
  });
  it("verification queue refuses duplicated filters instead of interpreting a forged first value",()=>{
    const s=read("verification/page.tsx");
    expect(s).toContain("Object.values(raw).some(Array.isArray)");
    expect(s).toContain("verificationQueueFilters.safeParse");
    expect(s).toContain('<ErrorState title="Invalid verification filters"');
    expect(s).not.toContain('Array.isArray(value)?value[0]:value');
    expect(s).toContain("requireSuperAdminVerificationCollege(context,collegeId)");
  });
  it("tenants expose read-only readiness and guard permissioned branding, domains and sign-in writes",()=>{
    expect(read("page.tsx")).toContain("getSuperAdminTenantLifecycleDetail(context,collegeId)");
    expect(read("branding/page.tsx")).toContain('can(context,"college.manage",{collegeId,organizationId:tenant.organizationId})');
    expect(read("subdomain/page.tsx")).toContain('requirePermission(context,"college.manage",{organizationId:college.organizationId,collegeId:college.id})');
    expect(read("signin/page.tsx")).toContain("collegeIdSchema.safeParse(collegeId)");
    expect(read("signin/page.tsx")).toContain("ready={policy.kind!==");
    expect(read("readiness/page.tsx")).toContain("No settings are modified.");
  });
  it("admin session list and revocation preserve capped results and explicit target",()=>{
    const sessions=read("admins/[userId]/page.tsx");
    expect(sessions).toContain("listCollegeAdminSessions(await getCurrentRequestContext(),collegeId,userId)");
    expect(sessions).toContain("<AdminRevokeSessions");
    expect(sessions).toContain("No active sessions for this account.");
    const history=read("admins/[userId]/history/page.tsx");
    expect(history).toContain("const context=await getCurrentRequestContext()");
    expect(history).toContain("listCollegeAdminHistory(context,collegeId,userId,page)");
    expect(history).toContain("No matching identity or platform history");
  });
});
