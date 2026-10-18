import {describe,expect,it} from "vitest";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";

const certId="11111111-1111-4111-8111-111111111111";
const item=(issueDate:string,expiryDate:string)=>({
 id:certId,name:"Course certification",issuingAuthority:"University",
 issueDate,expiryDate,credentialUrl:"https://university.example.edu/cert/1",
 description:"",
});
describe("LEARNER-CERT-EXPIRY-01 legacy learner certification calendar parity",()=>{
 it("accepts certification without optional dates and normal ascending issue/expiry ordering",()=>{
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([item("","")]).success).toBe(true);
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([
   item("2026-10-01","2028-10-01"),
  ]).success).toBe(true);
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([
   item("2024-02-29","2024-03-01"),
  ]).success).toBe(true);
 });
 it("blocks same-day and backwards expiry without deleting certification drafts",()=>{
  for(const dates of [["2026-10-01","2026-10-01"],["2026-10-19","2025-10-19"]]){
   const result=learnerProfileDocumentSchema.shape.certifications.safeParse([
    item(dates[0]!,dates[1]!),
   ]);
   expect(result.success).toBe(false);
   if(!result.success){
    expect(result.error.issues.some(issue=>issue.path.join(".")==="0.expiryDate")).toBe(true);
    expect(result.error.issues.some(issue=>issue.message==="Expiry date must be after issue date")).toBe(true);
   }
  }
 });
 it("rejects normalized invalid leap dates instead of moving certificate issue and expiry",()=>{
  for(const bad of ["2025-02-29","2026-04-31","2026-13-01","2026-10-01T12:00"]){
   expect(learnerProfileDocumentSchema.shape.certifications.safeParse([
    item(bad,"2028-01-01"),
   ]).success).toBe(false);
  }
 });
 it("still forbids forged extra tenant, user or privilege fields in learner certificate entries",()=>{
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([
   {...item("2026-01-01","2027-01-01"),collegeId:certId},
  ]).success).toBe(false);
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([
   {...item("2026-01-01","2027-01-01"),ownerUserId:certId},
  ]).success).toBe(false);
 });
});
