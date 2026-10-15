import {describe,expect,it} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
import {SUPER_ADMIN_LEGACY_GROUPS} from "@/modules/people/super-admin-legacy-tabs-model";
import {COLLEGE_LEGACY_GROUPS} from "@/modules/people/college-legacy-tabs-model";
const root=join(process.cwd(),"src/app/(authenticated)");
const read=(path:string)=>readFileSync(join(root,path),"utf8");
describe("chat-9 Super Admin and College final source copy gate",()=>{
 it("uses dev-legacy platform/college account headings",()=>{
  expect(read("admin/verification/page.tsx")).toContain(
   "Students' education and identity, checked against their documents.");
  for(const title of ["Create New Organization","Existing Organizations"])
   expect(read("admin/organizations/page.tsx")).toContain(title);
  for(const text of ["Create the customer, then make one college launch-ready",
    "Get this college ready to go live"])
   expect(read("admin/tenants/create/page.tsx")).toContain(text);
 });
 it("does not lose create/setup or secondary College routes",()=>{
  for(const path of ["admin/tenants/create","admin/tenants/setup",
    "college/companies","college/hiring-dashboard","college/faculty",
    "college/projects","college/domains","college/announcements",
    "college/groups","college/projects/reassign-mentor"])
   expect(existsSync(join(root,path,"page.tsx")),path).toBe(true);
 });
 it("preserves exact legacy Placements and Projects tab names and ordering",()=>{
  expect(COLLEGE_LEGACY_GROUPS.find(x=>x.title==="Placements")!.tabs.map(x=>x.label))
   .toEqual(["Drives","Companies","Interviews","Analytics"]);
  expect(SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="Placements")!.tabs.map(x=>x.label))
   .toEqual(["Drives","Companies","Interviews","Analytics","Recruiter accounts","Announcements"]);
  expect(SUPER_ADMIN_LEGACY_GROUPS.find(x=>x.title==="Projects")!.tabs.map(x=>x.label))
   .toEqual(["Templates","Workspaces","At Risk","Readiness","Submissions","Audit"]);
 });
});
