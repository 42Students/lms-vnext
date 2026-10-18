import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";

const mocks=vi.hoisted(()=>({context:vi.fn(),directory:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/people/college-role-directory-service",()=>({
 listCollegeRoleDirectory:mocks.directory,
}));
const fake=(label:string,attribute:string)=>(async()=>{
 const {createElement}=await import("react");
 return {default:(props:{membershipId:string})=>createElement("button",{
  type:"button",[attribute]:props.membershipId,
 },label)};
});
vi.mock("@/components/college/student-class-move-action",async()=>{
 const {createElement}=await import("react");
 return {StudentClassMoveAction:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-move":p.membershipId},"Move class")};
});
vi.mock("@/components/college/college-faculty-lifecycle-action",async()=>{
 const {createElement}=await import("react");
 return {CollegeFacultyLifecycleAction:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-faculty-state":p.membershipId},"Manage faculty")};
});
vi.mock("@/components/college/college-person-edit-action",async()=>{
 const {createElement}=await import("react");
 return {CollegePersonEditAction:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-edit":p.membershipId},"Edit profile")};
});
vi.mock("@/components/college/college-person-audit-modal",async()=>{
 const {createElement}=await import("react");
 return {CollegePersonAuditModal:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-audit":p.membershipId},"Activity")};
});
vi.mock("@/components/college/college-person-profile-overview-modal",async()=>{
 const {createElement}=await import("react");
 return {CollegePersonProfileOverviewModal:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-overview":p.membershipId},"Overview")};
});
vi.mock("@/components/college/college-student-import-history",async()=>{
 const {createElement}=await import("react");
 return {CollegeStudentImportHistory:()=>createElement("button",{type:"button"},"Bulk import history")};
});
vi.mock("@/components/college/college-student-lifecycle-action",async()=>{
 const {createElement}=await import("react");
 return {CollegeStudentLifecycleAction:(p:{membershipId:string})=>
  createElement("button",{type:"button","data-learner-state":p.membershipId},"Manage learner")};
});
vi.mock("@/components/admin/person-onboard-dialog",async()=>{
 const {createElement}=await import("react");
 return {PersonOnboardDialog:()=>createElement("button",{type:"button"},"Add person")};
});
import {CollegeRoleDirectoryWorkspace} from "@/components/college/college-role-directory-workspace";
import {parseCollegeRoleDirectorySearchParams} from "@/modules/people/college-role-directory-model";

const collegeId="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const actor={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"admin-member",collegeId,organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const base={
 filter:parseCollegeRoleDirectorySearchParams({}),metrics:{registered:1,active:1,suspended:0},
 total:1,pageSize:25,totalPages:1,sectionOptions:[],sectionOptionsTruncated:false,
 programOptions:[],programOptionsTruncated:false,cohortOptions:[],cohortOptionsTruncated:false,
 departmentOptions:[],departmentOptionsTruncated:false,
 employmentOptions:[],employmentOptionsTruncated:false,
};
const person={
 membershipId,name:"Student A",email:"student@example.edu",
 membershipStatus:"ACTIVE",userStatus:"ACTIVE",joinedAt:new Date("2099-10-18T05:00:00Z"),
 program:"Computing",cohort:"2099",sections:["A"],activeTeachingAssignments:0,
};
beforeEach(()=>{
 mocks.context.mockReset();mocks.directory.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.directory.mockResolvedValue({...base,items:[person]});
});
describe("COL-UX-PEOPLE-TABLE-03 mobile privacy and desktop People directory",()=>{
 it("keeps learner actions and active academic context accessible without a wide native table",async()=>{
  const html=renderToStaticMarkup(await CollegeRoleDirectoryWorkspace({
   kind:"LEARNER",searchParams:Promise.resolve({}),
  }));
  expect(html).toContain("Student A");
  expect(html).toContain("Computing");
  expect(html).toContain("View contact card");
  expect(html).toContain("Profile verification");
  expect(html).toContain('data-move="'+membershipId+'"');
  expect(html).toContain('data-edit="'+membershipId+'"');
  expect(html).toContain('data-audit="'+membershipId+'"');
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("Students directory scrollable columns");
  expect(mocks.directory).toHaveBeenCalledWith(actor,"LEARNER",expect.anything());
 });
 it("preserves faculty employment actions and never infers a nonexistent academic enrollment",async()=>{
  mocks.directory.mockResolvedValue({...base,items:[{
   ...person,program:null,cohort:null,sections:[],activeTeachingAssignments:2,
  }]});
  const html=renderToStaticMarkup(await CollegeRoleDirectoryWorkspace({
   kind:"FACULTY",searchParams:Promise.resolve({}),
  }));
  expect(html).toContain("2 active course teaching assignments");
  expect(html).toContain('data-faculty-state="'+membershipId+'"');
  expect(html).not.toContain("No active program/batch enrollment recorded");
  expect(html).toContain("Faculty directory scrollable columns");
 });
 it("does not render people from a rejected or revoked college role",async()=>{
  mocks.directory.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(CollegeRoleDirectoryWorkspace({
   kind:"LEARNER",searchParams:Promise.resolve({}),
  })).rejects.toThrow("REVOKED");
 });
 it("removes the desktop-only raw table without removing the existing native phone cards",()=>{
  const source=readFileSync("src/components/college/college-role-directory-workspace.tsx","utf8");
  expect(source).not.toContain("<table");
  expect(source).toContain('className="hidden md:block"');
  expect(source).toContain('className="space-y-3 p-3 md:hidden"');
  expect(source).toContain('caption={title+" directory"}');
  expect(source).toContain('getRowKey={item=>item.membershipId}');
 });
});
