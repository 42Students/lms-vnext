import {describe,it,expect} from "vitest";
import {verifyLogin,type AttemptRecord,type LoginDependencies,type LoginUser} from "@/modules/auth/login-service";
import {codeMac} from "@/modules/auth/crypto";

const secret="chat6-otp-breaker-secret";
const id="11111111-1111-4111-8111-111111111111";
const college="22222222-2222-4222-8222-222222222222";
const code="123456";
const emailCode="654321";
const user:LoginUser={id,identityUid:"identity-user",phoneE164:"+919876543210",
 email:"learner@example.test",displayName:"Learner",platformStatus:"ACTIVE"};
function fixture({expiresAt="2026-10-18T12:05:00Z",now="2026-10-18T12:00:00Z",
 tenant=college,superAdmin=false,activeUser=user,attemptUsed=false,validOtp=true,
 reserved=true}:{
 expiresAt?:string;now?:string;tenant?:string|null;superAdmin?:boolean;
 activeUser?:LoginUser;attemptUsed?:boolean;validOtp?:boolean;reserved?:boolean;
}={}){
 const state={reserves:0,consumes:0,used:attemptUsed,attempts:0};
 const attempt:AttemptRecord={
  id,userId:id,collegeId:tenant,
  smsCodeMac:codeMac(secret,"sms",id,validOtp?code:"999999"),
  smsCodeExpiresAt:new Date("2026-10-18T12:04:00Z"),
  emailCodeMac:superAdmin?codeMac(secret,"email",id,emailCode):null,
  emailCodeExpiresAt:superAdmin?new Date("2026-10-18T12:04:00Z"):null,
  verificationAttempts:0,expiresAt:new Date(expiresAt),usedAt:attemptUsed?new Date(now):null,
  dbNow:new Date(now),
 };
 const deps={
  repository:{
   loadAttempt:async()=>({...attempt,usedAt:state.used?new Date(now):null,
    verificationAttempts:state.attempts}),
   isSuperAdmin:async()=>superAdmin,
   reserveVerification:async()=>{state.reserves++;if(!reserved||state.attempts>=5)return false;
    state.attempts++;return true;},
   findUserById:async()=>activeUser,
   listMemberships:async()=>[{id:"33333333-3333-4333-8333-333333333333",
    collegeId:college,status:"ACTIVE"}],
   hasAnyRecruiterGrant:async()=>false,hasRecruiterGrantAtCollege:async()=>false,
   consumeAttempt:async()=>{state.consumes++;if(state.used)return false;state.used=true;return true;},
  },
  config:{secret},now:()=>new Date(now),
 } as unknown as LoginDependencies;
 return {state,deps};
}
const request=(tenantCollegeId:string|null=college)=>({
 attemptId:id,code,tenantCollegeId,
});
describe("chat-6 OTP verification adversarial state and CAS",()=>{
 it("AUTH-otp-verify-01 expiry is determined by database clock and spends zero guesses",async()=>{
  const {deps,state}=fixture({expiresAt:"2026-10-18T11:59:59Z"});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"OTP_EXPIRED"});
  expect(state.reserves).toBe(0);
  expect(state.consumes).toBe(0);
 });
 it("AUTH-otp-verify-02 cross-tenant challenge cannot be replayed on another college",async()=>{
  const {deps,state}=fixture();
  await expect(verifyLogin(request("44444444-4444-4444-8444-444444444444"),deps))
   .rejects.toMatchObject({code:"WRONG_TENANT"});
  expect(state.reserves).toBe(0);
  expect(state.consumes).toBe(0);
 });
 it("AUTH-otp-verify-03 consumed attempt cannot be replayed after refresh",async()=>{
  const {deps,state}=fixture({attemptUsed:true});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"INVALID_ATTEMPT"});
  expect(state.reserves).toBe(0);
 });
 it("AUTH-otp-verify-04 super admin missing second code is denied before attempt budget",async()=>{
  const {deps,state}=fixture({superAdmin:true});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"SECOND_FACTOR_REQUIRED"});
  expect(state.reserves).toBe(0);
 });
 it("AUTH-otp-verify-05 wrong OTP burns shared budget but cannot create session",async()=>{
  const {deps,state}=fixture({validOtp:false});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"INCORRECT_OTP"});
  expect(state.reserves).toBe(1);
  expect(state.consumes).toBe(0);
 });
 it("AUTH-otp-verify-06 super admin two independent channel codes allow one consume",async()=>{
  const {deps,state}=fixture({superAdmin:true});
  const ok=await verifyLogin({...request(),secondCode:emailCode},deps);
  expect(ok.user.id).toBe(id);
  expect(state.reserves).toBe(1);
  expect(state.consumes).toBe(1);
 });
 it("AUTH-otp-verify-07 double submit cannot consume a single challenge twice",async()=>{
  const {deps,state}=fixture();
  const results=await Promise.allSettled([verifyLogin(request(),deps),verifyLogin(request(),deps)]);
  expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  expect(results.filter(r=>r.status==="rejected")).toHaveLength(1);
  expect(state.consumes).toBe(2);
 });
 it("AUTH-otp-verify-08 suspension after OTP was issued blocks consume",async()=>{
  const {deps,state}=fixture({activeUser:{...user,platformStatus:"DISABLED"}});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"ACCOUNT_DISABLED"});
  expect(state.consumes).toBe(0);
 });
 it("AUTH-otp-verify-09 exhausted reservation is mapped to bounded retry error",async()=>{
  const {deps,state}=fixture({reserved:false});
  await expect(verifyLogin(request(),deps)).rejects.toMatchObject({code:"INVALID_ATTEMPT"});
  expect(state.reserves).toBe(1);
  expect(state.consumes).toBe(0);
 });
});
