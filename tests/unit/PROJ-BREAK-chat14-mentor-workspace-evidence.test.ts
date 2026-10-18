import {describe,expect,it} from "vitest";
import {
 safeProjectExternalHref,showMentorTaskCriteria,mentorSprintTaskFacts,mentorSprintEmptyWorkNotice,
 mentorTaskReviewEvidence,mentorTaskFeedbackHref,mentorWorkspaceTeamFacts,
 mentorWorkspaceMissingPrimaryMentor,mentorLatestDeliveryVersion,mentorRequiredResourceLinkState,
 buildMentorWorkspaceEvidence,
} from "@/modules/projects/mentor-workspace-evidence-model";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const A="33333333-3333-4333-8333-333333333333";
const B="44444444-4444-4444-8444-444444444444";

describe("PROJ-BREAK-MENTOR-134..145 approved workspace evidence boundaries",()=>{
 it("PROJ-BREAK-MENTOR-134 external links are credential-free web links only",()=>{
  for(const bad of ["javascript:alert(1)","data:text/html,<script>","file:///etc/passwd",
   "https://user:pass@other.edu/private","http://name@other.edu","//other.edu/test",
   "https://other.edu/"+("x".repeat(3000)),null]){
   expect(safeProjectExternalHref(bad),String(bad).slice(0,40)).toBeNull();
  }
  expect(safeProjectExternalHref("https://other.edu/docs")).toBe("https://other.edu/docs");
  expect(safeProjectExternalHref("http://other.edu/page")).toBe("http://other.edu/page");
 });
 it("PROJ-BREAK-MENTOR-135 acceptance criteria are presented to learners and mentors only",()=>{
  for(const role of ["LEARNER","MENTOR","ADMIN"] as const){
   expect(showMentorTaskCriteria(role," Verified  ")).toBe(role!=="ADMIN");
   expect(showMentorTaskCriteria(role,"  ")).toBe(false);
   expect(showMentorTaskCriteria(role,null)).toBe(false);
  }
 });
 it("PROJ-BREAK-MENTOR-136 task counters use only registered DONE, BLOCKED and IN_REVIEW",()=>{
  expect(mentorSprintTaskFacts([])).toEqual({
   total:0,done:0,blocked:0,inReview:0,completionPercent:null,
  });
  expect(mentorSprintTaskFacts([
   {status:"DONE"},{status:"BLOCKED"},{status:"IN_REVIEW"},{status:"IN_PROGRESS"},
  ])).toEqual({total:4,done:1,blocked:1,inReview:1,completionPercent:25});
  expect(mentorSprintTaskFacts([{status:"REOPENED"}]).completionPercent).toBe(0);
 });
 it("PROJ-BREAK-MENTOR-137 no task rows never imply 0 percent execution",()=>{
  expect(mentorSprintEmptyWorkNotice("COMPLETED",[])).toContain("no recorded tasks");
  expect(mentorSprintEmptyWorkNotice("ACTIVE",[])).toBe("No tasks have been recorded for this Sprint.");
  expect(mentorSprintEmptyWorkNotice("COMPLETED",[{status:"DONE"}])).toBeNull();
 });
 it("PROJ-BREAK-MENTOR-138 review-needed badge requires submitted evidence and task IN_REVIEW",()=>{
  expect(mentorTaskReviewEvidence("IN_REVIEW",{status:"SUBMITTED",version:2})).toBe("REVIEW_PENDING");
  expect(mentorTaskReviewEvidence("IN_REVIEW",null)).toBe("NO_SUBMISSION");
  expect(mentorTaskReviewEvidence("IN_REVIEW",{status:"APPROVED",version:1})).toBe("UNMATCHED");
  expect(mentorTaskReviewEvidence("DONE",{status:"SUBMITTED",version:2})).toBe("RECORDED");
 });
 it("PROJ-BREAK-MENTOR-139 exact task-feedback URL is scoped by both opaque UUIDs",()=>{
  expect(mentorTaskFeedbackHref(projectId,taskId))
   .toBe("/mentor/projects/"+projectId+"/tasks/"+taskId+"/feedback");
  const attacker=mentorTaskFeedbackHref(projectId,"../admin?actor=other");
  expect(attacker).not.toContain("/admin?actor=");
  expect(attacker).toContain("%2F");
 });
 it("PROJ-BREAK-MENTOR-140 team role counts never infer primary status from another role",()=>{
  const members=[
   {role:"LEARNER",isPrimary:true},{role:"MENTOR",isPrimary:false},
   {role:"MENTOR",isPrimary:true},{role:"ADMIN",isPrimary:true},
  ];
  expect(mentorWorkspaceTeamFacts(members)).toEqual({learners:1,mentors:2,primaryMentors:1});
  expect(mentorWorkspaceMissingPrimaryMentor("ACTIVE",members)).toBe(false);
  expect(mentorWorkspaceMissingPrimaryMentor("ACTIVE",members.filter(m=>m.role!=="MENTOR"))).toBe(true);
  expect(mentorWorkspaceMissingPrimaryMentor("ARCHIVED",[])).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-141 latest recorded final submission is the highest version",()=>{
  expect(mentorLatestDeliveryVersion([])).toBeNull();
  expect(mentorLatestDeliveryVersion([
   {version:3,status:"CHANGES_REQUESTED"},{version:1,status:"APPROVED"},
   {version:5,status:"DRAFT"},{version:4,status:"SUBMITTED"},
  ])).toEqual({version:5,status:"DRAFT"});
 });
 it("PROJ-BREAK-MENTOR-142 resource readiness does not treat private/invalid link as accessible",()=>{
  expect(mentorRequiredResourceLinkState({required:false,url:null,description:null})).toBe("NOT_REQUIRED");
  expect(mentorRequiredResourceLinkState({required:true,url:"https://other.edu",description:null}))
   .toBe("SAFE_LINK");
  expect(mentorRequiredResourceLinkState({required:true,url:"javascript:alert(1)",description:"Instructions"}))
   .toBe("TEXT_ONLY");
  expect(mentorRequiredResourceLinkState({required:true,url:"https://name:password@other.edu",description:null}))
   .toBe("LINK_UNAVAILABLE");
 });
 it("PROJ-BREAK-MENTOR-143 timeline projections group only tasks with persisted sprint associations",()=>{
  const model=buildMentorWorkspaceEvidence({
   tasks:[
    {sprintId:A,status:"DONE"},{sprintId:A,status:"BLOCKED"},
    {sprintId:B,status:"IN_REVIEW"},{sprintId:null,status:"TODO"},
   ],
   members:[{role:"MENTOR",isPrimary:true},{role:"LEARNER",isPrimary:false}],
   submissions:[{version:2,status:"SUBMITTED"},{version:1,status:"APPROVED"}],
  });
  expect(model.tasksBySprint[A]).toMatchObject({total:2,done:1,blocked:1,completionPercent:50});
  expect(model.tasksBySprint[B]).toMatchObject({total:1,inReview:1,completionPercent:0});
  expect(Object.keys(model.tasksBySprint).sort()).toEqual([A,B].sort());
  expect(model.team).toEqual({learners:1,mentors:1,primaryMentors:1});
  expect(model.latestDelivery).toEqual({version:2,status:"SUBMITTED"});
 });
 it("PROJ-BREAK-MENTOR-144 no persisted evidence keeps empty views and no invented percentages",()=>{
  const result=buildMentorWorkspaceEvidence({tasks:[],members:[],submissions:[]});
  expect(result.tasksBySprint).toEqual({});
  expect(result.team).toEqual({learners:0,mentors:0,primaryMentors:0});
  expect(result.latestDelivery).toBeNull();
 });
});
