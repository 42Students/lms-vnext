import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {
 diversityOutreachOnlyDecision,
 PrivateDiversityPolicyError,
 type PrivateDiversityOutreach,
} from "@/modules/placements/tpo-diversity-outreach-service";

const approved=(targetGender:PrivateDiversityOutreach["targetGender"]):PrivateDiversityOutreach=>
 ({targetGender,reason:"Widen participation",status:"APPROVED",version:1});

describe("PHASE2-DIVERSITY outreach decision is consent-based and never changes eligibility",()=>{
 it("PHASE2-DIVERSITY-01 no policy means no outreach",()=>{
  expect(diversityOutreachOnlyDecision(null,"FEMALE")).toEqual({outreach:false,eligibilityUnchanged:true});
 });

 it("PHASE2-DIVERSITY-02 only an APPROVED policy matching the learner's own consented self-description invites",()=>{
  expect(diversityOutreachOnlyDecision(approved("FEMALE"),"FEMALE").outreach).toBe(true);
  expect(diversityOutreachOnlyDecision(approved("FEMALE"),"MALE").outreach).toBe(false);
  expect(diversityOutreachOnlyDecision(approved("NON_BINARY"),"NON_BINARY").outreach).toBe(true);
  expect(diversityOutreachOnlyDecision(approved("SELF_DESCRIBED"),"SELF_DESCRIBED").outreach).toBe(true);
 });

 it("PHASE2-DIVERSITY-03 a learner who gave no consented self-description is never targeted",()=>{
  for(const g of ["FEMALE","MALE","NON_BINARY","SELF_DESCRIBED"] as const)
   expect(diversityOutreachOnlyDecision(approved(g),null).outreach,g).toBe(false);
 });

 it("PHASE2-DIVERSITY-04 DRAFT and DISABLED policies never invite anyone",()=>{
  for(const status of ["DRAFT","DISABLED"] as const){
   const policy={...approved("FEMALE"),status};
   expect(diversityOutreachOnlyDecision(policy,"FEMALE").outreach,status).toBe(false);
  }
 });

 it("PHASE2-DIVERSITY-05 eligibility is reported unchanged in every combination, so outreach can never reject or hide an application",()=>{
  const policies:(PrivateDiversityOutreach|null)[]=[null,approved("FEMALE"),{...approved("MALE"),status:"DRAFT"},{...approved("MALE"),status:"DISABLED"}];
  const consents=[null,"FEMALE","MALE","NON_BINARY","SELF_DESCRIBED"] as const;
  for(const p of policies)for(const c of consents){
   const r=diversityOutreachOnlyDecision(p,c);
   expect(r.eligibilityUnchanged).toBe(true);
   expect(Object.keys(r).sort()).toEqual(["eligibilityUnchanged","outreach"]);
  }
 });

 it("PHASE2-DIVERSITY-06 the decision never returns or echoes the learner's gender",()=>{
  const r=diversityOutreachOnlyDecision(approved("FEMALE"),"FEMALE");
  expect(JSON.stringify(r)).not.toMatch(/FEMALE|MALE|gender/i);
 });

 it("PHASE2-DIVERSITY-07 policy errors carry only a stable code",()=>{
  for(const code of ["DIVERSITY_NOT_READY","DIVERSITY_ACCESS_DENIED"] as const){
   const e=new PrivateDiversityPolicyError(code);
   expect(e).toBeInstanceOf(Error);
   expect(e.code).toBe(code);
   expect(e.message).toBe(code);
   expect(e.name).toBe("PrivateDiversityPolicyError");
  }
 });
});

describe("PHASE2-DIVERSITY privacy gates in the service source",()=>{
 const src=fs.readFileSync(path.join(process.cwd(),"src","modules","placements","tpo-diversity-outreach-service.ts"),"utf8");

 it("PHASE2-DIVERSITY-08 every database entry point is behind the privacy-approval readiness gate",()=>{
  expect(src).toContain('!featureReady("diversityOutreach")');
  const exported=[...src.matchAll(/export\s+async\s+function\s+([A-Za-z0-9_$]+)/g)].map(m=>m[1]!);
  expect(exported.length).toBeGreaterThan(1);
  for(const name of exported){
   const at=src.indexOf(`export async function ${name}`);
   const body=src.slice(at,at+1500);
   expect(/requireReady\(\)/.test(body),`${name} skips the readiness gate`).toBe(true);
  }
 });

 it("PHASE2-DIVERSITY-09 saving and reviewing require the placements.manage permission inside the locked transaction",()=>{
  expect(/assertPersistedPlatformPermission\(tx,\s*context,\s*"placements\.manage"/.test(src)).toBe(true);
 });

 it("PHASE2-DIVERSITY-10 the module documents that no learner gender is returned and recruiters have no route to it",()=>{
  expect(src).toMatch(/Nothing in this module\s+\* returns learner gender/);
  expect(src).toMatch(/recruiters have no route to its data/);
 });
});
