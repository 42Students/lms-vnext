import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS} from "@/modules/people/super-admin-legacy-tabs-model";
const root=join(process.cwd(),"src/app/(authenticated)");
const copy=[
 ["dashboard/page.tsx","Dashboard"],
 ["admin/tenants/page.tsx","Tenant Setup"],
 ["admin/features/page.tsx","Feature Controls"],
 ["admin/module-access/page.tsx","Module Access"],
 ["admin/settings/page.tsx","Tenant Settings"],
 ["admin/audit/page.tsx","Audit Log"],
 ["activity/page.tsx","Activity Log"],
 ["admin/inbound-mail/page.tsx","Inbound mail"],
 ["admin/verification/page.tsx","Profile verification"],
 ["admin/hr/page.tsx","Recruiter accounts"],
 ["admin/announcements/page.tsx","Announcements"],
] as const;
describe("Super Admin exact dev-legacy per-page title strings (legacy-copy-B)",()=>{
 for(const [file,title] of copy){
  it(file+" uses the exact title case",()=>{
   const source=readFileSync(join(root,file==="admin/tenants/page.tsx"?"admin/tenants/directory/page.tsx":file),"utf8");
   if(file==="admin/tenants/page.tsx") {
    expect(readFileSync(join(root,file),"utf8")).toContain('<TenantDirectory searchParams={Promise.resolve(raw)}');
   }
   expect(source).toContain('title="'+title+'"');
  });
 }
 it("Recruiter accounts editor heading exactly matches its Placements tab",()=>{
  const source=readFileSync(join(process.cwd(),
   "src/components/admin/super-admin-hr-accounts.tsx"),"utf8");
  expect(source).toContain('title="Recruiter accounts"');
  expect(SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="Placements")?.tabs
   .find(x=>x.href==="/admin/recruiters")?.label).toBe("Recruiter accounts");
 });
 it("all legacy group headings and tab labels stay in order",()=>{
  expect(SUPER_ADMIN_LEGACY_GROUPS.map(x=>x.title)).toEqual([
   "Tenant Setup","Academic Setup","Courses & Content","People","Placements","Projects",
  ]);
  expect(SUPER_ADMIN_LEGACY_GROUPS[4]!.tabs.map(x=>x.label)).toEqual([
   "Drives","Companies","Interviews","Analytics","Recruiter accounts","Announcements",
  ]);
  expect(SUPER_ADMIN_LEGACY_GROUPS[5]!.tabs.map(x=>x.label)).toEqual([
   "Templates","Workspaces","At Risk","Readiness","Submissions","Audit",
  ]);
 });
});
