import {describe,expect,it} from "vitest";
import {canRecruiterResubmit,initialRecruiterRequestStatus,
 recruiterDriveRequestInputSchema,recruiterRequestLegacyLabel,recruiterRequestStage
} from "@/modules/placements/recruiter-drive-request-model";

describe("REC-home-drives-21 recruiter formal request contract",()=>{
 it("auto-approves trusted recruiters to a draft, never publishes",()=>{
  expect(initialRecruiterRequestStatus({trusted:true,approvalRequired:true,verificationPending:false})).toBe("DRAFT");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:false,verificationPending:true})).toBe("REQUEST");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:false,verificationPending:false})).toBe("DRAFT");
  expect(initialRecruiterRequestStatus({trusted:false,approvalRequired:true,verificationPending:false})).toBe("REQUEST");
 });
 it("requires a server-college-scoped idempotency key and rejects injected fields",()=>{
  const input={collegeId:"11111111-1111-4111-8111-111111111111",submissionId:"22222222-2222-4222-8222-222222222222",
   draft:{title:"Software Engineer",description:"Build robust product features",location:"Hyderabad",employmentType:"FULL_TIME",workMode:"ONSITE",ctcLpa:"10",
   minimumAnnualCtcInr:"",maximumAnnualCtcInr:"",fixedAnnualCtcInr:"",variableAnnualCtcInr:"",bondMonths:"",bondAmountInr:"",minimumCgpa:"",maximumActiveBacklogs:"",rounds:[{kind:"INTERVIEW",name:"Interview"}]}};
  expect(recruiterDriveRequestInputSchema.safeParse(input).success).toBe(true);
  expect(recruiterDriveRequestInputSchema.safeParse({...input,companyRelationshipId:"attacker"}).success).toBe(false);
  expect(recruiterDriveRequestInputSchema.safeParse({...input,submissionId:"bad"}).success).toBe(false);
 });
 it("maps every request status without silently hiding declined or cancelled work",()=>{
  for(const s of ["REQUEST","SENT_BACK","DRAFT"] as const){
   expect(recruiterRequestStage(s)).toBe("WAITING");
   expect(recruiterRequestLegacyLabel(s)).toBe("Sent for review");
  }
  for(const s of ["REJECTED","CANCELLED"] as const){
   expect(recruiterRequestStage(s)).toBe("CLOSED");
   expect(recruiterRequestLegacyLabel(s)).toBe("Cancelled");
  }
  expect(canRecruiterResubmit("SENT_BACK")).toBe(true);
  expect(canRecruiterResubmit("REJECTED")).toBe(false);
 });
});
