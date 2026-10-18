import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({actor:vi.fn(),directory:vi.fn(),redirect:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.actor}));
vi.mock("@/modules/people/admin-unassigned-user-service",()=>({
 listSuperAdminUnassignedUsers:stubs.directory,
}));
vi.mock("next/navigation",()=>({redirect:stubs.redirect}));
import UnassignedIdentityDirectory from "@/app/(authenticated)/admin/people/unassigned/page";

const globalAdmin={user:{id:"super",identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null};
const page=(search:Record<string,string|string[]|undefined>)=>
 UnassignedIdentityDirectory({searchParams:Promise.resolve(search)});
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.actor.mockResolvedValue(globalAdmin);
 stubs.redirect.mockImplementation((href:string)=>{throw new Error("REDIRECT:"+href);});
 stubs.directory.mockResolvedValue({
  query:{q:"",platformStatus:"ALL",role:"ALL",page:1},
  total:0,totalPages:1,page:1,items:[],
 });
});
describe("SA-PEOPLE-UNASSIGNED-URL-01 global identity privacy",()=>{
 it("rejects forged/duplicate status and pagination before any global user query",async()=>{
  for(const invalid of [
   {q:["one","two"]},{page:["1"]},{role:["ALL","SUPER_ADMIN"]},
   {collegeId:"11111111-1111-4111-8111-111111111111"},
   {page:"0"},{platformStatus:"UNKNOWN"},
  ]){
   const markup=renderToStaticMarkup(await page(invalid));
   expect(markup).toContain("Invalid user filters");
   expect(markup).toContain("Clear filters");
  }
  expect(stubs.directory).not.toHaveBeenCalled();
 });
 it("denies a selected organization or college from browsing global unassigned identities",async()=>{
  for(const adminScope of [
   {organizationId:"22222222-2222-4222-8222-222222222222",collegeId:null},
   {organizationId:null,collegeId:"33333333-3333-4333-8333-333333333333"},
  ]){
   stubs.actor.mockResolvedValueOnce({...globalAdmin,adminScope});
   const markup=renderToStaticMarkup(await page({}));
   expect(markup).toContain("Clear the admin scope");
  }
  expect(stubs.directory).not.toHaveBeenCalled();
 });
 it("denies Faculty, Mentor, Learner and suspended Super Admin before global user reads",async()=>{
  for(const role of ["FACULTY","MENTOR","LEARNER"] as const){
   stubs.actor.mockResolvedValueOnce({
    ...globalAdmin,user:{...globalAdmin.user,systemRoles:[]},
    membership:{id:"member",collegeId:"college",organizationId:"org",
     status:"ACTIVE",roles:[role]},
   });
   await expect(page({})).rejects.toThrow("REDIRECT:/dashboard");
  }
  stubs.actor.mockResolvedValueOnce({
   ...globalAdmin,user:{...globalAdmin.user,platformStatus:"DISABLED"},
  });
  await expect(page({})).rejects.toThrow("REDIRECT:/dashboard");
  expect(stubs.directory).not.toHaveBeenCalled();
 });
 it("presents no-contact empty state without fabricating unassigned identities",async()=>{
  const markup=renderToStaticMarkup(await page({}));
  expect(markup).toContain("Users without college memberships");
  expect(markup).toContain("No matching users");
  expect(markup).toContain("Personal contact and session information are excluded");
  expect(stubs.directory).toHaveBeenCalledOnce();
 });
});