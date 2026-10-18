import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({load:vi.fn()}));
vi.mock("@/modules/academics/scope",()=>({loadSectionScope:stubs.load}));
import {resolveSuperAdminSectionDetail} from "@/modules/admin-ui/super-admin-section-detail";

const sectionId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
function context():RequestContext{
 return {
  user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{collegeId,organizationId},
 };
}
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.load.mockResolvedValue({id:sectionId,sectionName:"Section A",collegeId,organizationId});
});
describe("SA-ACADEMICS-SECTION-01 Super Admin route actor and exact Section scope",()=>{
 it("lets an active selected-college Super Admin open only the actual selected Section",async()=>{
  const value=await resolveSuperAdminSectionDetail(context(),sectionId);
  expect(value).toMatchObject({id:sectionId,collegeId,organizationId});
  expect(stubs.load).toHaveBeenCalledOnce();
  expect(stubs.load).toHaveBeenCalledWith(sectionId);
 });
 it("denies Faculty, Mentor, Learner and College Admin even if their context carries an adminScope",async()=>{
  const superAdmin=context();
  for(const role of ["FACULTY","MENTOR","LEARNER","COLLEGE_ADMIN"] as const){
   const principal:RequestContext={
    ...superAdmin,
    user:{...superAdmin.user,systemRoles:[]},
    membership:{id:"member",collegeId,organizationId,status:"ACTIVE",roles:[role]},
   };
   await expect(resolveSuperAdminSectionDetail(principal,sectionId))
    .rejects.toThrow("Missing permission: academics.read");
  }
  expect(stubs.load).not.toHaveBeenCalled();
 });
 it("denies disabled Super Admin account before reading Section metadata",async()=>{
  const active=context();
  await expect(resolveSuperAdminSectionDetail({
   ...active,user:{...active.user,platformStatus:"DISABLED"},
  },sectionId)).rejects.toThrow("Missing permission: academics.read");
  expect(stubs.load).not.toHaveBeenCalled();
 });
 it("privately hides a different college or organization even if Section ID is valid",async()=>{
  stubs.load.mockResolvedValueOnce({
   id:sectionId,collegeId:"44444444-4444-4444-8444-444444444444",
   organizationId,
  });
  await expect(resolveSuperAdminSectionDetail(context(),sectionId)).resolves.toBeNull();
  stubs.load.mockResolvedValueOnce({
   id:sectionId,collegeId,
   organizationId:"55555555-5555-4555-8555-555555555555",
  });
  await expect(resolveSuperAdminSectionDetail(context(),sectionId)).resolves.toBeNull();
 });
 it("shows missing selection and invalid Section IDs as private absence, without database reads",async()=>{
  const ctx=context();
  await expect(resolveSuperAdminSectionDetail({
   ...ctx,adminScope:{collegeId:null,organizationId},
  },sectionId)).resolves.toBeNull();
  await expect(resolveSuperAdminSectionDetail(ctx,"invalid-id")).resolves.toBeNull();
  expect(stubs.load).not.toHaveBeenCalled();
 });
 it("propagates unexpected database outages to the error boundary instead of hiding them as not found",async()=>{
  stubs.load.mockRejectedValueOnce(new Error("database temporarily unavailable"));
  await expect(resolveSuperAdminSectionDetail(context(),sectionId))
   .rejects.toThrow("database temporarily unavailable");
 });
});
