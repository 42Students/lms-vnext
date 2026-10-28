import {describe,it,expect} from "vitest";
import {ownAccountProofScope} from "@/modules/identity/own-account-proof-authorization";
import type {RequestContext} from "@/modules/identity/context";

const id="00000000-0000-4000-8000-000000000001";
const memberId="00000000-0000-4000-8000-000000000002";
function current(role:"LEARNER"|"FACULTY"|"TPO"="LEARNER"):RequestContext{
 return {
  user:{id,identityUid:"db004-user",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:memberId,collegeId:"college-A",organizationId:"org-A",
   status:"ACTIVE",roles:[role]},
  recruiter:null,adminScope:null,
 };
}
describe("DB-004 only signed-in own current role may request/consume proof",()=>{
 it("derives canonical identifiers and selected learner scope",()=>{
  expect(ownAccountProofScope(current(),{userId:id},"PHONE","R-100")).toEqual({
   userId:id,membershipId:memberId,role:"LEARNER",
   channel:"PHONE",expectedRollNumber:"R-100",
  });
 });
 it("never allows another signed-in user to target this membership",()=>{
  expect(()=>ownAccountProofScope(current(),{userId:"attacker"},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
 });
 it("denies no workspace and suspended/disabled identity",()=>{
  const noMember={...current(),membership:null};
  expect(()=>ownAccountProofScope(noMember,{userId:id},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
  const suspended=current();
  suspended.membership={...suspended.membership!,status:"SUSPENDED"};
  expect(()=>ownAccountProofScope(suspended,{userId:id},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
  const disabled=current();
  disabled.user.platformStatus="DISABLED";
  expect(()=>ownAccountProofScope(disabled,{userId:id},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
 });
 it("rejects other roles, arbitrary channels, multi-role and faculty roll probes",()=>{
  expect(()=>ownAccountProofScope(current("TPO"),{userId:id},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
  expect(()=>ownAccountProofScope(current("FACULTY"),{userId:id},"EMAIL","R-100"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
  expect(()=>ownAccountProofScope(current(),{userId:id},"FAKE" as "EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
  const multi=current();
  multi.membership={...multi.membership!,roles:["LEARNER","FACULTY"]};
  expect(()=>ownAccountProofScope(multi,{userId:id},"EMAIL"))
   .toThrow("ROLE_PROOF_CONTEXT_DENIED");
 });
 it("allows own faculty proof only as faculty, never user-supplied role",()=>{
  expect(ownAccountProofScope(current("FACULTY"),{userId:id},"EMAIL"))
   .toEqual({userId:id,membershipId:memberId,role:"FACULTY",channel:"EMAIL"});
 });
});
