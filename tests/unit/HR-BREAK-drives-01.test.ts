import {describe,expect,it} from "vitest";
import {recruiterTodayWaitingRequests} from "@/modules/placements/recruiter-today-waiting-model";
import {recruiterDriveProgressSteps,recruiterDriveNextAction}
 from "@/modules/placements/recruiter-drive-progress-model";
import {initialRecruiterRequestStatus,canRecruiterResubmit,
 recruiterRequestStage,recruiterRequestLegacyLabel,recruiterRequestUpdateSchema}
 from "@/modules/placements/recruiter-drive-request-model";
import {nextHrProposalAttempt} from "@/modules/placements/hr-drive-proposal-attempt-model";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";

const id="123e4567-e89b-42d3-a456-426614174000";
const state={shared:0,active:0,withdrawn:0,issuedOffers:0,acceptedOffers:0,
 totalRounds:0,completedRounds:0,readOnly:false};

describe("HR-BREAK-drives-01: recruiter requests, retries and stale tabs",()=>{
 it("Today only surfaces persisted review/sent-back requests, capped to eight newest",()=>{
  const requests=Array.from({length:12},(_,i)=>({
   id:String(i),status:i===11?"REJECTED":i===10?"DRAFT":i===9?"CANCELLED":
    i===8?"SENT_BACK":"REQUEST",
   draft:i===7?null:{title:"Role "+i},
   createdAt:new Date(2026,9,1+i),
  }));
  const result=recruiterTodayWaitingRequests(requests);
  expect(result).toHaveLength(8);
  expect(result.map(row=>row.id)).toEqual(["8","7","6","5","4","3","2","1"]);
  expect(result.find(row=>row.id==="7")?.title).toBe("Hiring request");
  expect(requests).toHaveLength(12);
 });
 it("a drive cannot reach Completed on an accepted offer alone",()=>{
  const stages=recruiterDriveProgressSteps(state);
  expect(stages.filter(row=>row.state==="CURRENT").map(row=>row.label)).toEqual(["Applications"]);
  expect(recruiterDriveProgressSteps({...state,shared:3,totalRounds:2})
   .filter(row=>row.state==="CURRENT")[0]?.label).toBe("Rounds");
  expect(recruiterDriveProgressSteps({...state,issuedOffers:1})
   .filter(row=>row.state==="CURRENT")[0]?.label).toBe("Offers");
  expect(recruiterDriveProgressSteps({...state,acceptedOffers:1})
   .filter(row=>row.state==="CURRENT")[0]?.label).toBe("Offers");
  expect(recruiterDriveProgressSteps({...state,closed:true,readOnly:true})
   .filter(row=>row.state==="CURRENT")[0]?.label).toBe("Completed");
  expect(recruiterDriveNextAction({...state,readOnly:true}).label).toBe("Hire again");
  expect(recruiterDriveNextAction({...state,issuedOffers:1}).tab).toBe("offers");
  expect(recruiterDriveNextAction(state).tab).toBe("applicants");
 });
 it("never autoapproves unverified recruiters, even with college approval disabled",()=>{
  expect(initialRecruiterRequestStatus({verificationPending:true,trusted:true,approvalRequired:false})).toBe("REQUEST");
  expect(initialRecruiterRequestStatus({verificationPending:false,trusted:false,approvalRequired:true})).toBe("REQUEST");
  expect(initialRecruiterRequestStatus({verificationPending:false,trusted:true,approvalRequired:true})).toBe("DRAFT");
  expect(initialRecruiterRequestStatus({verificationPending:false,trusted:false,approvalRequired:false})).toBe("DRAFT");
 });
 it("allows edit/resubmit only in request states and treats withdrawn requests as closed",()=>{
  expect(canRecruiterResubmit("REQUEST")).toBe(true);
  expect(canRecruiterResubmit("SENT_BACK")).toBe(true);
  for(const status of ["DRAFT","REJECTED","CANCELLED"] as const)
   expect(canRecruiterResubmit(status)).toBe(false);
  expect(recruiterRequestStage("CANCELLED")).toBe("CLOSED");
  expect(recruiterRequestStage("REJECTED")).toBe("CLOSED");
  expect(recruiterRequestLegacyLabel("DRAFT")).toMatch(/Approved/);
 });
 it("validates stale-state token and exact draft identity on recruiter request changes",()=>{
  const valid={requestId:id,collegeId:id,action:"CANCEL",
   expectedUpdatedAt:"2026-10-18T10:00:00+05:30"};
  expect(recruiterRequestUpdateSchema.safeParse(valid).success).toBe(true);
  for(const change of [{requestId:"other-college"},{expectedUpdatedAt:"yesterday"},
   {action:"PUBLISH"},{untrustedGrant:true},{expectedUpdatedAt:""}]){
   expect(recruiterRequestUpdateSchema.safeParse({...valid,...change}).success).toBe(false);
  }
  const draft={...emptyHrDriveDraft(),title:"Software Engineer",ctcLpa:"8"};
  expect(recruiterRequestUpdateSchema.safeParse({...valid,action:"RESUBMIT",draft}).success).toBe(true);
  expect(recruiterRequestUpdateSchema.safeParse({...valid,action:"RESUBMIT",draft:emptyHrDriveDraft()}).success).toBe(false);
 });
 it("same payload reuses idempotency key; edited payload rotates it without mutating old attempt",()=>{
  let serial=0;
  const next=()=>String(++serial);
  const first=nextHrProposalAttempt(null,"job:a",next);
  const replay=nextHrProposalAttempt(first,"job:a",next);
  const changed=nextHrProposalAttempt(first,"job:b",next);
  expect(first).toBe(replay);
  expect(changed.submissionId).not.toBe(first.submissionId);
  expect(first.signature).toBe("job:a");
  expect(serial).toBe(2);
 });
});