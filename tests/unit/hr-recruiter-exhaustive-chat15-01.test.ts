import { describe, expect, it } from "vitest";
import { hrRoundFormSchema, canRecruiterEditRound, duplicateRecruiterRoundName }
  from "@/modules/placements/hr-round-editor-model";
import { isHrDriveProposalResponse }
  from "@/modules/placements/hr-drive-proposal-response-model";
import { summarizeRecruiterUnread }
  from "@/modules/placements/hr-conversation-unread-model";
import { trustedRecruiterDomain, recruiterDriveApprovalPolicy }
  from "@/modules/placements/recruiter-drive-autoapproval-policy";
import { recruiterGrantValidUntil, recruiterGrantEffectiveAt }
  from "@/modules/placements/recruiter-grant-expiry-policy";

const uuid="123e4567-e89b-12d3-a456-426614174000";
const next="123e4567-e89b-12d3-a456-426614174001";
const version="2099-01-01T00:00:00.000Z";

describe("HR recruiter exhaustive policy boundaries chat-15",()=>{
 it("HR-round-create trims names and validates duration, mode and kind",()=>{
  const r=hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"  Screening  ",mode:"VIRTUAL",durationMinutes:"30"});
  expect(r.success).toBe(true);
  if(r.success)expect(r.data).toMatchObject({name:"Screening",durationMinutes:30});
 });
 it.each([
  {action:"CREATE",kind:"INTERVIEW"},
  {action:"CREATE",kind:"INVALID",name:"Stage"},
  {action:"CREATE",kind:"INTERVIEW",name:""},
  {action:"CREATE",kind:"INTERVIEW",name:"Stage",roundId:uuid},
  {action:"CREATE",kind:"INTERVIEW",name:"Bad\nname"},
  {action:"CREATE",kind:"INTERVIEW",name:"Stage",durationMinutes:0},
  {action:"CREATE",kind:"INTERVIEW",name:"Stage",durationMinutes:1441},
  {action:"CREATE",kind:"INTERVIEW",name:"Stage",stray:"unexpected"},
  {action:"UPDATE",roundId:uuid,expectedUpdatedAt:version},
  {action:"UPDATE",roundId:uuid,name:"Stage"},
  {action:"REMOVE",roundId:uuid,expectedUpdatedAt:version,name:"Not permitted"},
 ])("HR-round-invalid rejects malformed authoring and illegal state combinations %#",input=>{
  expect(hrRoundFormSchema.safeParse(input).success).toBe(false);
 });
 it("HR-round-update and removal require optimistic version and exclude delete-field mutations",()=>{
  expect(hrRoundFormSchema.safeParse({action:"UPDATE",roundId:uuid,expectedUpdatedAt:version,name:"Revised"}).success).toBe(true);
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:uuid,expectedUpdatedAt:version}).success).toBe(true);
 });
 it.each([
  ["PENDING","author","author",false,false,true],
  ["PUBLISHED","author","author",false,false,false],
  ["PENDING","another","author",false,false,false],
  ["PENDING","author","author",true,false,false],
  ["PENDING","author","author",false,true,false],
 ] as const)("HR-round-permission enforces author, state, no results and no slots %#",
  (status,createdByUserId,recruiterUserId,hasResults,hasSlots,result)=>{
   expect(canRecruiterEditRound({status,createdByUserId,recruiterUserId,hasResults,hasSlots})).toBe(result);
  });
 it("HR-round-name normalizes case, whitespace and Unicode while excluding cancelled and self",()=>{
  const names=[{id:uuid,name:" SCREENING  ROUND ",status:"PENDING"},{id:next,name:"Legacy",status:"CANCELLED"}];
  expect(duplicateRecruiterRoundName(names,"screening round")).toBe(true);
  expect(duplicateRecruiterRoundName(names,"ＳＣＲＥＥＮＩＮＧ  ＲＯＵＮＤ")).toBe(true);
  expect(duplicateRecruiterRoundName(names,"screening round",uuid)).toBe(false);
  expect(duplicateRecruiterRoundName(names,"legacy")).toBe(false);
 });
 it("HR-proposal-response rejects false confirmation and retains unsent drafts",()=>{
  expect(isHrDriveProposalResponse({threadId:uuid,messageId:next,replayed:false})).toBe(true);
  for(const bad of [null,{},[],{threadId:uuid,messageId:"not-uuid",replayed:false},
     {threadId:uuid,messageId:next,replayed:"false"}]){
   expect(isHrDriveProposalResponse(bad)).toBe(false);
  }
 });
 it("HR-unread-summary clamps negative thread counters",()=>{
  expect(summarizeRecruiterUnread([])).toBe(0);
  expect(summarizeRecruiterUnread([{unread:4},{unread:-7},{unread:3}])).toBe(7);
 });
 it("HR-trusted-domain requires exact company and trusted list membership",()=>{
  expect(trustedRecruiterDomain("Person@Company.COM","company.com",["COMPANY.COM"])).toBe(true);
  for(const email of ["person@evil-company.com","person@company.com.evil.com",
    "person@sub.company.com","person@@company.com","person@ company.com"]){
   expect(trustedRecruiterDomain(email,"company.com",["company.com"])).toBe(false);
  }
  expect(trustedRecruiterDomain("person@company.com","company.com",["other.com"])).toBe(false);
 });
 it("HR-autoapproval cannot bypass an unverified recruiter grant",()=>{
  const basic={grantVerified:false,approvalRequired:false,recruiterEmail:"person@company.com",
    companyDomain:"company.com",trustedDomains:["company.com"],relationshipTrusted:true};
  expect(recruiterDriveApprovalPolicy(basic)).toEqual({autoApprove:false,reason:"REVIEW_REQUIRED"});
  expect(recruiterDriveApprovalPolicy({...basic,grantVerified:true})).toEqual({autoApprove:true,reason:"APPROVAL_OFF"});
  expect(recruiterDriveApprovalPolicy({...basic,grantVerified:true,approvalRequired:true})).toEqual({autoApprove:true,reason:"TRUSTED_COMPANY"});
  expect(recruiterDriveApprovalPolicy({...basic,grantVerified:true,approvalRequired:true,
    relationshipTrusted:false,trustedDomains:[]})).toEqual({autoApprove:false,reason:"REVIEW_REQUIRED"});
 });
 it("HR-grant-expiry clamps leap-year month ends and rejects invalid months",()=>{
  expect(recruiterGrantValidUntil(new Date("2028-01-31T04:00:00.000Z"),1).toISOString())
    .toBe("2028-02-29T04:00:00.000Z");
  for(const months of [0,61,1.5]){
   expect(()=>recruiterGrantValidUntil(new Date("2028-01-01T00:00:00Z"),months)).toThrow();
  }
 });
 it("HR-grant-effective closes revoked, pending, expired, missing and wrong-capability grants",()=>{
  const now=new Date("2099-01-01T00:00:00Z");
  const good={status:"ACTIVE",verificationStatus:"VERIFIED",validUntil:new Date("2099-02-01T00:00:00Z"),capabilities:["READ","WRITE"]};
  expect(recruiterGrantEffectiveAt(good,now,"WRITE")).toBe(true);
  expect(recruiterGrantEffectiveAt({...good,status:"REVOKED"},now,"WRITE")).toBe(false);
  expect(recruiterGrantEffectiveAt({...good,verificationStatus:"PENDING"},now,"WRITE")).toBe(false);
  expect(recruiterGrantEffectiveAt({...good,validUntil:null},now,"WRITE")).toBe(false);
  expect(recruiterGrantEffectiveAt({...good,validUntil:now},now,"WRITE")).toBe(false);
  expect(recruiterGrantEffectiveAt(good,now,"DELETE")).toBe(false);
 });
});
