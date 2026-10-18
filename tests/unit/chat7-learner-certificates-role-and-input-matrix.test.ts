import {describe,expect,it} from "vitest";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";

const id="11111111-1111-4111-8111-111111111111";
const second="22222222-2222-4222-8222-222222222222";
const credential={
 id,name:"Professional certificate",issuingAuthority:"Institution",
 issueDate:"2099-01-01",expiryDate:"2100-01-01",
 credentialUrl:"https://issuer.example.edu/verify/1",description:"",
};

describe("COURSES-LEARNER-CERTIFICATES-01 private credential authoring and review",()=>{
 it("retains independent learner credentials, including undated or no-expiry certificates",()=>{
  const result=learnerProfileDocumentSchema.shape.certifications.safeParse([
   credential,{...credential,id:second,issueDate:"",expiryDate:""},
  ]);
  expect(result.success).toBe(true);
  if(result.success){
   expect(result.data).toHaveLength(2);
   expect(result.data[0]?.credentialUrl).toBe("https://issuer.example.edu/verify/1");
   expect(result.data[1]?.expiryDate).toBe("");
  }
 });
 it("rejects forged college, owner and other user fields and invalid credential schemes",()=>{
  for(const entry of [
   {...credential,collegeId:id},
   {...credential,ownerUserId:id},
   {...credential,certificateAwardedByAdmin:true},
   {...credential,credentialUrl:"javascript:alert(1)"},
   {...credential,credentialUrl:"data:text/html,<script>alert(1)</script>"},
   {...credential,credentialUrl:"https://user:secret@issuer.example.edu/cert"},
   {...credential,id:"not-a-uuid"},
   {...credential,name:" "},
   {...credential,name:"x".repeat(241)},
   {...credential,description:"x".repeat(3001)},
  ])expect(learnerProfileDocumentSchema.shape.certifications.safeParse([entry]).success).toBe(false);
 });
 it("refuses impossible dates, backwards expiry and future-facing duplicate fields",()=>{
  for(const entry of [
   {...credential,issueDate:"2099-02-29"},
   {...credential,expiryDate:"2099-01-01"},
   {...credential,expiryDate:"2098-01-01"},
   {...credential,issueDate:"2099-13-01"},
   {...credential,issueDate:"2099-12-31T15:00:00Z"},
  ])expect(learnerProfileDocumentSchema.shape.certifications.safeParse([entry]).success).toBe(false);
 });
 it("caps saved certificate list at 50 without leaking unbounded user input",()=>{
  const fifty=Array.from({length:50},(_,index)=>({...credential,id:index===0?id:second}));
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse(fifty).success).toBe(true);
  expect(learnerProfileDocumentSchema.shape.certifications.safeParse([...fifty,credential]).success).toBe(false);
 });
});
