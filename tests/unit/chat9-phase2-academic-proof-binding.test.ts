import {describe,expect,it} from "vitest";
import {parseAcademicSnapshot} from "@/modules/profile-verification/academic-snapshot";
import {validateSubmittedEvidence,type Receipt} from "@/modules/profile-verification/evidence";
const id=(n:number)=>"10000000-0000-4000-8000-"+String(n).padStart(12,"0");
const member=id(100);
const entry=(type:string,grade:string,year:string,doc?:number)=>({
  id:id(doc??9),educationType:type,grade,gradingType:"Percentage",max:"100",
  endYear:year,...(doc?{marksheetDocumentId:id(doc)}:{}),
});
const now=new Date("2026-10-16T08:00:00Z");
const receipt=(n:number,purpose:Receipt["purpose"],relatedEntryId:string|null):Receipt=>({
  id:id(n),owningMembershipId:member,purpose,relatedEntryId,
  scanStatus:"CLEAN",privateObjectKey:"private/college/member/file",
  objectGeneration:"123",sha256Hex:"a".repeat(64),mimeType:"application/pdf",
  sizeBytes:10,revokedAt:null,retentionUntil:null,
});
describe("T-S2-09 and T-S2-10 published mark receipt binding",()=>{
  const documents=[
    entry("10th","80","2015",1),entry("12th","82","2017",2),
    entry("UG","77","2021",3),entry("PG","94","2024"),
  ];
  const receipts=[
    receipt(1,"MARKSHEET",id(1)),receipt(2,"MARKSHEET",id(2)),
    receipt(3,"MARKSHEET",id(3)),receipt(8,"RESUME",null),
  ];
  it("publishes only marked and documented education entries",()=>{
    const rows=parseAcademicSnapshot({education:documents});
    expect(rows.map(x=>x.level)).toEqual(["10TH","12TH","UG"]);
    expect(rows.map(x=>x.grade)).not.toContain("94");
  });
  it("chooses the latest documented duplicate, not newer unsupported marks",()=>{
    const rows=parseAcademicSnapshot({education:[
      ...documents,entry("UG","99","2025"),
    ]});
    expect(rows.find(x=>x.level==="UG")?.grade).toBe("77");
  });
  it("rejects a forged optional reference even if the core three are documented",()=>{
    expect(validateSubmittedEvidence(member,"EDUCATION",{
      education:[...documents,entry("PG","94","2024",9)],
      resumeDocumentId:id(8),
    },receipts,now)).toBe(false);
  });
  it("accepts optional unlinked study when three core documents and resume are CLEAN",()=>{
    expect(validateSubmittedEvidence(member,"EDUCATION",{
      education:documents,resumeDocumentId:id(8),
    },receipts,now)).toBe(true);
  });
});
