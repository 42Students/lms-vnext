import {describe,it,expect} from "vitest";
import {startLogin,LoginError,type LoginDependencies,type LoginMembership,type LoginUser}
 from "@/modules/auth/login-service";

const phone="+919876543210";
const user:LoginUser={id:"11111111-1111-4111-8111-111111111111",
 identityUid:"auth-user",phoneE164:phone,email:"student@example.test",
 displayName:"Member",platformStatus:"ACTIVE"};
const tenantA="22222222-2222-4222-8222-222222222222";
const tenantB="33333333-3333-4333-8333-333333333333";
const active=(collegeId:string):LoginMembership=>({
 id:"44444444-4444-4444-8444-444444444444",collegeId,status:"ACTIVE"});
function fakeDeps(opts:{user?:LoginUser|null;memberships?:LoginMembership[];superAdmin?:boolean;
 recruiterGrant?:boolean}={}):LoginDependencies {
 const who=opts.user===undefined?user:opts.user;
 return {
  repository:{
   findUserByPhone:async()=>who,
   findUserByEmail:async()=>who,
   listMemberships:async()=>opts.memberships??[],
   isSuperAdmin:async()=>opts.superAdmin??false,
   hasAnyRecruiterGrant:async()=>opts.recruiterGrant??false,
   hasRecruiterGrantAtCollege:async()=>opts.recruiterGrant??false,
  },
  config:{secret:"unit-test-key"},
  newId:()=>tenantB,
  now:()=>new Date("2026-10-18T00:00:00Z"),
 } as unknown as LoginDependencies;
}
const request=(tenantCollegeId:string|null)=>({channel:"PHONE" as const,contact:phone,tenantCollegeId});
const rejects=async(promise:Promise<unknown>,code:LoginError["code"])=>{
 await expect(promise).rejects.toMatchObject({name:"LoginError",code});
};
describe("chat-6 authentication breaker — cross-tenant and disabled role journeys",()=>{
 it("AUTH-role-01 disabled user is rejected before OTP creation on college and platform hosts",async()=>{
  const deps=fakeDeps({user:{...user,platformStatus:"DISABLED"},memberships:[active(tenantA)]});
  await rejects(startLogin(request(tenantA),deps),"ACCOUNT_DISABLED");
  await rejects(startLogin(request(null),deps),"ACCOUNT_DISABLED");
 });
 it("AUTH-role-02 active user with only ended memberships cannot log in on platform host",async()=>{
  await rejects(startLogin(request(null),fakeDeps({memberships:[
   {...active(tenantA),status:"ENDED"}]})),"NO_ACCOUNT_FOR_DOMAIN");
 });
 it("AUTH-role-03 foreign-college active membership never authenticates into target college",async()=>{
  await rejects(startLogin(request(tenantB),fakeDeps({memberships:[active(tenantA)]})),
   "NO_ACCOUNT_FOR_DOMAIN");
 });
 it("AUTH-role-04 suspended college membership blocks sign-in rather than using a fallback",async()=>{
  await rejects(startLogin(request(tenantA),fakeDeps({memberships:[
   {...active(tenantA),status:"SUSPENDED"}]})),"ACCOUNT_SUSPENDED");
 });
 it("AUTH-role-05 Super Admin must have independent email and phone factors",async()=>{
  await rejects(startLogin(request(null),fakeDeps({
   user:{...user,email:null},superAdmin:true})), "SECOND_FACTOR_UNAVAILABLE");
 });
 it("AUTH-role-06 unknown phone cannot create an OTP session",async()=>{
  await rejects(startLogin(request(tenantA),fakeDeps({user:null})),"NOT_REGISTERED");
 });
});
