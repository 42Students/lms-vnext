import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const p=vi.hoisted(()=>({can:vi.fn()}));
vi.mock("@/modules/permissions/policy",()=>({can:p.can}));
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const base:RequestContext={
 user:{id:"actor",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:a,organizationId:"org-a",status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
 recruiter:null,
};
describe("PROJ-BREAK-HR-COLLEGE-01: project listing never guesses or widens selected tenant",()=>{
 beforeEach(()=>{vi.clearAllMocks();p.can.mockReturnValue(true);});
 it("active college admin derives the only assigned college through central permission",()=>{
  expect(getProjectAdminCollegeId(base)).toBe(a);
  expect(p.can).toHaveBeenCalledWith(base,"projects.manage",{
   collegeId:a,organizationId:"org-a",
  });
 });
 it("a recruiter without college membership cannot use their employer grant as Projects admin scope",()=>{
  const recruiter:RequestContext={...base,membership:null,recruiter:{
   userId:"actor",companyId:"company",companyName:"Employer",title:null,status:"ACTIVE",
   grants:[{id:"g",organizationId:"org",collegeId:a,
    collegeName:"College",companyRelationshipId:"rel"}],
  }};
  expect(getProjectAdminCollegeId(recruiter)).toBeNull();
  expect(p.can).not.toHaveBeenCalled();
 });
 it("a Super Admin must explicitly select an acting college, never inherit an unrelated membership",()=>{
  const sa:RequestContext={...base,user:{...base.user,systemRoles:["SUPER_ADMIN"]},
   adminScope:{collegeId:b,organizationId:"org-b"}};
  expect(getProjectAdminCollegeId(sa)).toBe(b);
  expect(p.can).toHaveBeenCalledWith(sa,"projects.manage",{collegeId:b,organizationId:"org-b"});
  p.can.mockClear();
  expect(getProjectAdminCollegeId({...sa,adminScope:null})).toBeNull();
  expect(p.can).not.toHaveBeenCalled();
 });
 it("denied or mismatched project permission fails closed even if membership points to a real college",()=>{
  p.can.mockReturnValue(false);
  expect(getProjectAdminCollegeId(base)).toBeNull();
  expect(p.can).toHaveBeenCalledOnce();
 });
 it("disabled Super Admin user cannot claim its adminScope; inactive company membership alone is not authority",()=>{
  const ctx:RequestContext={
   ...base,user:{...base.user,platformStatus:"DISABLED",systemRoles:["SUPER_ADMIN"]},
   membership:null,adminScope:{collegeId:b,organizationId:"org-b"},
  };
  expect(getProjectAdminCollegeId(ctx)).toBeNull();
  expect(p.can).not.toHaveBeenCalled();
 });
});
