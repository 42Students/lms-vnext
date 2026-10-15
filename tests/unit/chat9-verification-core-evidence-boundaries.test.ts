import {describe,expect,it} from "vitest";
import {evaluateVerificationEvidence,validateSubmittedEvidence,type Receipt} from
 "@/modules/profile-verification/evidence";
const member="10000000-0000-4000-8000-000000000100";
const other="10000000-0000-4000-8000-000000000200";
const id=(n:number)=>"10000000-0000-4000-8000-"+String(n).padStart(12,"0");
const date=new Date("2026-10-16T10:00:00.000Z");
const receipt=(n:number,purpose:Receipt["purpose"],entry:string|null=null):Receipt=>({
 id:id(n),owningMembershipId:member,purpose,relatedEntryId:entry,
 scanStatus:"CLEAN",privateObjectKey:"private/college/member/evidence",
 objectGeneration:"1",sha256Hex:"a".repeat(64),mimeType:"application/pdf",
 sizeBytes:1200,revokedAt:null,retentionUntil:null,
});
const documents=[receipt(1,"MARKSHEET",id(1)),receipt(2,"MARKSHEET",id(2)),
 receipt(3,"MARKSHEET",id(3)),receipt(4,"RESUME"),receipt(5,"PAN"),receipt(6,"AADHAAR")];
const academic=[
 {id:id(1),educationType:"10th",grade:"80",marksheetDocumentId:id(1)},
 {id:id(2),educationType:"12th",grade:"81",marksheetDocumentId:id(2)},
 {id:id(3),educationType:"UG",grade:"77",marksheetDocumentId:id(3)},
 {id:id(7),educationType:"PG",grade:"",endYear:"2026"},
];
const education={education:academic,resumeDocumentId:id(4)};
describe("T-S2-10 private evidence boundaries (legacy OR / core-three policy)",()=>{
 it("accepts only Aadhaar+matching-clean-doc OR PAN+matching-clean-doc",()=>{
  expect(validateSubmittedEvidence(member,"IDENTITY",{
   aadhaarNumber:"XXXXXXXX1234",aadhaarDocumentId:id(6),
  },documents,date)).toBe(true);
  expect(validateSubmittedEvidence(member,"IDENTITY",{
   panNumber:"XXXXXX1234",panDocumentId:id(5),
  },documents,date)).toBe(true);
  expect(validateSubmittedEvidence(member,"IDENTITY",{
   aadhaarNumber:"XXXXXXXX1234",panNumber:"XXXXXX1234",
   panDocumentId:id(5),
  },documents.filter(x=>x.id!==id(6)),date)).toBe(true);
  expect(validateSubmittedEvidence(member,"IDENTITY",{
   panNumber:"XXXXXX1234",panDocumentId:id(6),
  },documents,date)).toBe(false);
 });
 it("accepts documented core milestones with optional blank PG",()=>{
  expect(validateSubmittedEvidence(member,"EDUCATION",education,documents,date)).toBe(true);
  const normalized=academic.map(x=>({id:x.id,educationType:x.educationType,
   gradeObtained:x.grade}));
  expect(evaluateVerificationEvidence({
   owningMembershipId:member,section:"EDUCATION",education:normalized,
   hasAadhaarNumber:false,hasPanNumber:false,receipts:documents,now:date,
  }).ready).toBe(true);
 });
 it("denies linked forged optional docs instead of borrowing any clean receipt",()=>{
  expect(validateSubmittedEvidence(member,"EDUCATION",{
   education:[...academic,{id:id(8),educationType:"PG",grade:"89",
    marksheetDocumentId:id(8)}],resumeDocumentId:id(4),
  },documents,date)).toBe(false);
 });
 it("rejects expired, revoked, wrong-owner and pending required receipts",()=>{
  const fail=[{...documents[0]!,scanStatus:"PENDING" as const},
   {...documents[0]!,owningMembershipId:other},
   {...documents[0]!,revokedAt:date},
   {...documents[0]!,retentionUntil:new Date(date.getTime()-1000)}];
  for(const broken of fail){
   expect(validateSubmittedEvidence(member,"EDUCATION",education,
     documents.map(x=>x.id===broken.id?broken:x),date)).toBe(false);
  }
 });
 it("requires a CLEAN private resume rather than publicly exposing its URL",()=>{
  expect(validateSubmittedEvidence(member,"EDUCATION",education,
   documents.filter(x=>x.id!==id(4)),date)).toBe(false);
  expect(validateSubmittedEvidence(member,"EDUCATION",{
   ...education,resumeDocumentId:"https://public.example/resume.pdf",
  },documents,date)).toBe(false);
 });
});
