import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({context:vi.fn(),list:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:stubs.context,
}));
vi.mock("@/modules/people/admin-user-directory-service",()=>({
 listSuperAdminUsers:stubs.list,
}));
vi.mock("next/navigation",()=>({
 redirect:stubs.redirect,
}));
import SuperAdminUserDirectory from "@/app/(authenticated)/admin/people/directory/page";

const admin={user:{id:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId:"11111111-1111-4111-8111-111111111111",
  organizationId:"22222222-2222-4222-8222-222222222222"}};
const render=(raw:Record<string,string|string[]|undefined>)=>
 SuperAdminUserDirectory({searchParams:Promise.resolve(raw)});
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.context.mockResolvedValue(admin);
 stubs.redirect.mockImplementation((path:string)=>{throw new Error("REDIRECT:"+path);});
 stubs.list.mockResolvedValue({
  query:{tab:"ALL",q:"",role:"ALL",membershipStatus:"ALL",platformStatus:"ALL",page:1},
  total:0,totalPages:1,items:[],contactVisible:false,
 });
});
describe("SA-PEOPLE-DIRECTORY-QUERY-02 validated directory links",()=>{
 it("shows actionable invalid filters without reading a selected college for repeated/unknown keys",async()=>{
  for(const raw of [
   {page:["1","999"]},{q:["name"]},{tab:["ALL","FACULTY"]},
   {collegeId:"foreign"},{page:"0"},{q:"x".repeat(101)},
   {platformStatus:"UNKNOWN"},
  ]){
   const html=renderToStaticMarkup(await render(raw));
   expect(html).toContain("Invalid directory filters");
   expect(html).toContain("Clear filters");
  }
  expect(stubs.context).not.toHaveBeenCalled();
  expect(stubs.list).not.toHaveBeenCalled();
 });
 it("honors normal same-college query and masked contact empty state",async()=>{
  const html=renderToStaticMarkup(await render({tab:"ALL",page:"1"}));
  expect(html).toContain("People Directory");
  expect(html).toContain("No matching users");
  expect(html).toContain("Email and phone are masked");
  expect(stubs.list).toHaveBeenCalledWith(admin,expect.objectContaining({
   tab:"ALL",page:1,
  }));
 });
 it("does not allow a Faculty-only or disabled Super Admin to query global people roster",async()=>{
  for(const user of [
   {...admin.user,systemRoles:[]},
   {...admin.user,platformStatus:"DISABLED"},
  ]){
   stubs.context.mockResolvedValueOnce({...admin,user});
   await expect(render({})).rejects.toThrow("REDIRECT:/dashboard");
  }
  expect(stubs.list).not.toHaveBeenCalled();
 });
});