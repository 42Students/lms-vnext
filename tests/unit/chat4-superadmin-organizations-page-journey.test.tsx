import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";

const mocks=vi.hoisted(()=>({context:vi.fn(),list:vi.fn(),archived:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/organizations/service",()=>({
 listOrganizations:mocks.list,listArchivedOrganizations:mocks.archived,
}));
vi.mock("@/components/admin/organization-create-form",async()=>{
 const {createElement}=await import("react");
 return {OrganizationCreateForm:()=>createElement("span",{"data-testid":"org-create"},"Create organization")};
});
vi.mock("@/components/admin/organization-actions",async()=>{
 const {createElement}=await import("react");
 return {OrganizationActions:(props:{organizationId:string})=>
  createElement("span",{"data-org-actions":props.organizationId},"Manage")};
});
vi.mock("@/components/admin/tenant-restore-action",async()=>{
 const {createElement}=await import("react");
 return {TenantRestoreAction:(props:{id:string;kind:string})=>
  createElement("span",{"data-restore":props.id,"data-kind":props.kind},"Restore")};
});
vi.mock("@/components/ui/data-table",async()=>{
 const {createElement}=await import("react");
 type Row={id:string;name:string};
 type Column={key:string;cell:(row:Row)=>ReactNode};
 return {DataTable:({rows,columns,empty}:{
  rows:Row[];columns:Column[];empty?:ReactNode;
 })=>createElement("section",{"aria-label":"Existing Organizations"},
  rows.length?rows.map(row=>createElement("article",{key:row.id},
   columns.map(col=>createElement("div",{key:col.key},col.cell(row))))):empty)};
});
import OrganizationsPage from "@/app/(authenticated)/admin/organizations/page";

const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
const params=(query:Record<string,string|string[]|undefined>)=>({
 searchParams:Promise.resolve(query),
});
beforeEach(()=>{
 mocks.context.mockReset();mocks.list.mockReset();mocks.archived.mockReset();
 mocks.context.mockResolvedValue(actor);
 mocks.list.mockResolvedValue([]);
 mocks.archived.mockResolvedValue([]);
});
describe("SA-organizations-page-01 real directory permission, filters and restore states",()=>{
 it("denies duplicate and unknown URL keys before any private tenant directory read",async()=>{
  for(const query of [{page:["1","2"]},{page:"1e2"},{unknown:"foreign"}]){
   const html=renderToStaticMarkup(await OrganizationsPage(params(query)));
   expect(html).toContain("Invalid organization directory filters");
   expect(html).toContain("Clear filters");
  }
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.archived).not.toHaveBeenCalled();
 });
 it("does not show even invalid filters to a disabled or non-Super Admin account",async()=>{
  mocks.context.mockResolvedValue({
   user:{...actor.user,systemRoles:[]},
   membership:{id:"local",collegeId:org,organizationId:org,
    status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
  });
  await expect(OrganizationsPage(params({page:"1e2"}))).rejects.toBeDefined();
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("renders real scoped organizations, search and pagination without invented records",async()=>{
  const rows=Array.from({length:12},(_,i)=>({
   id:"org-"+i,name:"Campus "+i,createdAt:new Date("2099-01-01T00:00:00Z"),
  }));
  mocks.list.mockResolvedValue(rows);
  const html=renderToStaticMarkup(await OrganizationsPage(params({
   q:"campus",page:"2",pageSize:"10",
  })));
  expect(html).toContain("Campus 10");
  expect(html).toContain("Campus 11");
  expect(html).not.toContain(">Campus 0<");
  expect(html).toContain("Page 2 of 2");
  expect(html).toContain("Existing Organizations");
  expect(mocks.list).toHaveBeenCalledWith(actor);
 });
 it("shows actual archived restoration choices only for an authorized platform administrator",async()=>{
  mocks.archived.mockResolvedValue([{
   id:org,name:"Retired organization",
  }]);
  const html=renderToStaticMarkup(await OrganizationsPage(params({})));
  expect(html).toContain("Retired organization");
  expect(html).toContain('data-restore="'+org+'"');
  expect(html).toContain('data-testid="org-create"');
  expect(mocks.archived).toHaveBeenCalledWith(actor);
 });
 it("renders an honest empty organization directory",async()=>{
  const html=renderToStaticMarkup(await OrganizationsPage(params({})));
  expect(html).toContain("No organizations in this scope");
  expect(html).not.toContain("Campus 1");
 });
});
