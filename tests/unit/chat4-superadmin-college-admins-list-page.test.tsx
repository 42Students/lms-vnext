import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {readFileSync} from "node:fs";
import type { ReactNode } from "react";

const mocks=vi.hoisted(()=>({context:vi.fn(),targets:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/colleges/admin-session-service",()=>({
 listCollegeAdminSessionTargetsPage:mocks.targets,
}));
vi.mock("@/components/admin/person-onboard-dialog",async()=>{
 const {createElement}=await import("react");
 return {PersonOnboardDialog:(props:{forcedRole:string})=>
  createElement("span",{"data-role":props.forcedRole},"Onboard "+props.forcedRole)};
});
vi.mock("@/components/admin/college-admin-lifecycle-action",async()=>{
 const {createElement}=await import("react");
 return {CollegeAdminLifecycleAction:(props:{status:string})=>
  createElement("span",{"data-lifecycle":props.status},"Manage access")};
});
vi.mock("@/components/ui/data-table",async()=>{
 const {createElement}=await import("react");
 type Row={userId:string};
 type Column={key:string;cell:(row:Row)=>ReactNode};
 return {DataTable:({rows,columns,empty}:{
  rows:Row[];columns:Column[];empty?:ReactNode;
 })=>createElement("section",{"aria-label":"College Admin and TPO accounts"},
  rows.length?rows.map(row=>createElement("article",{key:row.userId},
   columns.map(column=>createElement("div",{key:column.key},column.cell(row))))):empty)};
});
import CollegeAdministratorsPage from "@/app/(authenticated)/admin/colleges/[collegeId]/admins/page";

const collegeId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
const params={params:Promise.resolve({collegeId}),searchParams:Promise.resolve({})};
beforeEach(()=>{
 mocks.context.mockReset();mocks.targets.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.targets.mockResolvedValue({college:{name:"IIT Dharwad",organizationId:org},items:[],total:0,page:1,pageCount:1,pageSize:25,truncated:false});
});
describe("SA-colleges-admins-list-01 tenant administrator roster page",()=>{
 it("G2-5-030-018 keeps unsaved administrator details on navigation",()=>{
  const dialog=readFileSync("src/components/admin/person-onboard-dialog.tsx","utf8");
  expect(dialog).toContain('window.addEventListener("beforeunload",beforeUnload)');
  expect(dialog).toContain('document.addEventListener("click",interceptLink,true)');
  expect(dialog).toContain("Leave without saving administrator details?");
  expect(dialog).toContain("pending={pending}");
 });
 it("renders the empty/permission-safe scoped directory without invented admins",async()=>{
  const html=renderToStaticMarkup(await CollegeAdministratorsPage(params));
  expect(html).toContain("IIT Dharwad");
  expect(html).toContain("No active College Admin or TPO accounts");
  expect(html).toContain('data-role="COLLEGE_ADMIN"');
  expect(html).toContain('data-role="TPO"');
  expect(html).not.toContain("fake@example.edu");
  expect(mocks.targets).toHaveBeenCalledWith(actor,collegeId,1,"ALL");
 });
 it("renders real role/status and authorized nested device and history URLs",async()=>{
  mocks.targets.mockResolvedValue({
   college:{name:"IIT Dharwad",organizationId:org},
   items:[{userId,membershipId:"member-id",name:"Admin A",email:"admin@example.edu",
    roles:["COLLEGE_ADMIN"],status:"SUSPENDED"}],
   total:1,page:1,pageCount:1,pageSize:25,truncated:false,
  });
  const html=renderToStaticMarkup(await CollegeAdministratorsPage(params));
  expect(html).toContain("Admin A");
  expect(html).toContain("admin@example.edu");
  expect(html).toContain("Suspended");
  expect(html).toContain('data-lifecycle="SUSPENDED"');
  expect(html).toContain("View active devices");
  expect(html).toContain("View administrator history");
  expect(html).toContain("/admins/"+userId);
  expect(html).toContain("/admins/"+userId+"/history");
 });
 it("discloses bounded server-side pagination rather than implying a complete roster",async()=>{
  mocks.targets.mockResolvedValue({college:{name:"IIT Dharwad",organizationId:org},items:[],total:26,page:1,pageCount:2,pageSize:25,truncated:false});
  const html=renderToStaticMarkup(await CollegeAdministratorsPage(params));
  expect(html).toContain("0 of 26 college administrators");
  expect(html).toContain("Page 1 of 2");
 });
 it("does not render administrator details or expose errors when the scoped service denies the actor",async()=>{
  mocks.targets.mockRejectedValue(new Error("REVOKED"));
  const html=renderToStaticMarkup(await CollegeAdministratorsPage(params));
  expect(html).toContain("Could not load administrator accounts");
  expect(html).not.toContain("REVOKED");
  expect(html).not.toContain("admin@example.edu");
 });
});
