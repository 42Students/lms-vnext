import {describe,expect,it} from "vitest";
import {mentorEstimationUnit,mentorEstimateOptions,mentorEstimateLabel} from "@/modules/projects/mentor-estimation-unit-model";
import {mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema} from "@/modules/projects/mentor-final-delivery-decision-model";
import {mentorDeliveryVersionParamsSchema,mentorDeliveryVersionDisplay} from "@/modules/projects/mentor-delivery-version-model";
import {closeoutChecklist,mentorCloseoutParamsSchema,mentorCloseoutSchema} from "@/modules/projects/mentor-closeout-model";
import {mentorTaskFeedbackParamsSchema,taskFeedbackStatusLabel} from "@/modules/projects/mentor-task-feedback-model";
import {mentorTaskReviewTokenMatches,mentorTaskReviewTokenSchema} from "@/modules/projects/mentor-task-review-token-model";
import {compareMentorProjects,compareMentorProjectsByProgress,compareMentorProjectsByMostProgress,
 compareMentorProjectsByOpenTasks,compareMentorProjectsByTeamSize} from "@/modules/projects/mentor-project-order-model";

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const TS="2026-10-18T10:00:00.123Z";
const active={id:A,title:"Sprint 2",status:"ACTIVE",updatedAt:new Date("2026-10-18T10:00:00Z")};
const older={id:B,title:"Sprint 10",status:"ACTIVE",updatedAt:new Date("2026-10-17T10:00:00Z")};
const archived={...older,status:"ARCHIVED"};

describe("PROJ-BREAK-MENTOR-76..84 finite state and final-delivery consistency",()=>{
 it("PROJ-BREAK-MENTOR-76 estimation defaults only to registered units and bounded labels",()=>{
  expect(mentorEstimationUnit(null)).toBe("POINTS");
  expect(mentorEstimationUnit("UNTRUSTED")).toBe("POINTS");
  expect(mentorEstimationUnit("HOURS")).toBe("HOURS");
  expect(mentorEstimationUnit("TASKS")).toBe("TASKS");
  for(const raw of [null,"POINTS","HOURS","TASKS","UNKNOWN"]){
   const options=mentorEstimateOptions(raw);
   expect(options[0]).toBe(0);
   expect(options.every(x=>Number.isSafeInteger(x)&&x>=0)).toBe(true);
   expect(options.length).toBeLessThanOrEqual(13);
  }
  expect(mentorEstimateLabel(null,"HOURS")).toBe("Not estimated");
  expect(mentorEstimateLabel(1,"HOURS")).toBe("1 hr");
  expect(mentorEstimateLabel(2,"HOURS")).toBe("2 hrs");
  expect(mentorEstimateLabel(1,"TASKS")).toBe("1 task");
  expect(mentorEstimateLabel(0,null)).toBe("0 pts");
 });
 it("PROJ-BREAK-MENTOR-77 final approval may review only latest SUBMITTED in ACTIVE project",()=>{
  for(const delivery of ["DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED","LOCKED","UNKNOWN"]){
   for(const project of ["PLANNED","ACTIVE","COMPLETED","ARCHIVED","UNKNOWN"]){
    expect(mentorFinalDeliveryCanReview(delivery,project),delivery+" -> "+project)
     .toBe(delivery==="SUBMITTED"&&project==="ACTIVE");
   }
  }
  const payload={decision:"APPROVED",expectedUpdatedAt:TS,confirmed:true};
  expect(mentorFinalDeliveryDecisionSchema.safeParse(payload).success).toBe(true);
  expect(mentorFinalDeliveryDecisionSchema.safeParse({...payload,decision:"CHANGES_REQUESTED",feedback:"  Fix tests "}).success).toBe(true);
  for(const bad of [
   {...payload,decision:"CHANGES_REQUESTED"},
   {...payload,decision:"CHANGES_REQUESTED",feedback:"  "},
   {...payload,decision:"FAKE"},
   {...payload,confirmed:false},
   {...payload,actorMembershipId:A},
   {...payload,expectedUpdatedAt:"2026-10-18"},
  ])expect(mentorFinalDeliveryDecisionSchema.safeParse(bad).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-78 version renderer does not assume prior DRAFT or no review is approved",()=>{
  const empty=mentorDeliveryVersionDisplay({
   id:A,version:1,status:"DRAFT",submittedAt:null,decision:null,reviewedAt:null,feedback:null,
  });
  expect(empty.hasReview).toBe(false);
  expect(empty.decisionLabel).toBe("Draft — not submitted");
  expect(empty.submissionType).toBe("Text");
  expect(empty.feedback).toBeNull();
  const uploaded=mentorDeliveryVersionDisplay({
   id:B,version:2,status:"APPROVED",submittedAt:new Date(TS),decision:"APPROVED",
   reviewedAt:new Date(TS),feedback:" Approved ",attachments:[{kind:"FILE"}],
  });
  expect(uploaded.hasReview).toBe(true);
  expect(uploaded.submissionType).toBe("File upload");
  expect(uploaded.feedback).toBe("Approved");
  expect(mentorDeliveryVersionParamsSchema.safeParse({projectId:A,submissionId:B}).success).toBe(true);
  expect(mentorDeliveryVersionParamsSchema.safeParse({projectId:A,submissionId:"../admin"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-79 closeout requires all registered evidence, no inferred DONE state",()=>{
  const permitted={projectStatus:"ACTIVE",approved:true,openTasks:0,openSprints:0,openReleases:0};
  expect(closeoutChecklist(permitted).canComplete).toBe(true);
  for(const override of [
   {projectStatus:"ARCHIVED"},{projectStatus:"COMPLETED"},{projectStatus:"PLANNED"},
   {approved:false},{openTasks:1},{openSprints:1},{openReleases:1},
   {openTasks:-1},{openSprints:-1},{openReleases:-1},
  ])expect(closeoutChecklist({...permitted,...override}).canComplete).toBe(false);
  const input={expectedUpdatedAt:TS,confirmDeliveryReviewed:true,confirmTeamNotified:true,confirmCloseout:true};
  expect(mentorCloseoutSchema.safeParse(input).success).toBe(true);
  for(const bad of [{...input,confirmTeamNotified:false},{...input,confirmCloseout:false},
   {...input,actorId:A},{...input,expectedUpdatedAt:"not-date"}]){
   expect(mentorCloseoutSchema.safeParse(bad).success).toBe(false);
  }
  expect(mentorCloseoutParamsSchema.safeParse({projectId:A}).success).toBe(true);
  expect(mentorCloseoutParamsSchema.safeParse({projectId:"other"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-80 task review decisions require a version token and confirmation",()=>{
  expect(taskFeedbackStatusLabel("APPROVED")).toBe("Approved");
  expect(taskFeedbackStatusLabel("CHANGES_REQUESTED")).toBe("Changes requested");
  expect(taskFeedbackStatusLabel("UNKNOWN")).toBe("Reviewed");
  expect(mentorTaskFeedbackParamsSchema.safeParse({projectId:A,taskId:B}).success).toBe(true);
  expect(mentorTaskFeedbackParamsSchema.safeParse({projectId:A,taskId:"forged"}).success).toBe(false);
  expect(mentorTaskReviewTokenSchema.safeParse({expectedUpdatedAt:TS,confirmed:true}).success).toBe(true);
  expect(mentorTaskReviewTokenSchema.safeParse({expectedUpdatedAt:TS,confirmed:false}).success).toBe(false);
  expect(mentorTaskReviewTokenSchema.safeParse({expectedUpdatedAt:TS,actorId:A,confirmed:true}).success).toBe(false);
  expect(mentorTaskReviewTokenMatches(new Date(TS),TS)).toBe(true);
  expect(mentorTaskReviewTokenMatches(new Date(TS),"2026-10-18T10:00:00.124Z")).toBe(false);
  expect(mentorTaskReviewTokenMatches(new Date(TS),"INVALID")).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-81 archive always sorts behind active projects across all requested orders",()=>{
  expect(compareMentorProjects(active,archived,"TITLE")).toBeLessThan(0);
  expect(compareMentorProjectsByProgress(active,archived,null,100)).toBeLessThan(0);
  expect(compareMentorProjectsByMostProgress(active,archived,0,100)).toBeLessThan(0);
  expect(compareMentorProjectsByOpenTasks(active,archived,0,50)).toBeLessThan(0);
  expect(compareMentorProjectsByTeamSize(active,archived,0,50,"LARGEST")).toBeLessThan(0);
 });
 it("PROJ-BREAK-MENTOR-82 numeric titles, ties and unknown progress have stable ordering",()=>{
  expect(compareMentorProjects(active,older,"RECENT")).toBeLessThan(0);
  expect(compareMentorProjects(active,older,"TITLE")).toBeLessThan(0);
  expect(compareMentorProjectsByProgress(active,older,NaN,50)).toBeGreaterThan(0);
  expect(compareMentorProjectsByProgress(active,older,0,50)).toBeLessThan(0);
  expect(compareMentorProjectsByMostProgress(active,older,90,50)).toBeLessThan(0);
  expect(compareMentorProjectsByMostProgress(active,older,Infinity,50)).toBeGreaterThan(0);
  expect(compareMentorProjectsByOpenTasks(active,older,5,2)).toBeLessThan(0);
  expect(compareMentorProjectsByTeamSize(active,older,2,5,"LARGEST")).toBeGreaterThan(0);
  expect(compareMentorProjectsByTeamSize(active,older,2,5,"SMALLEST")).toBeLessThan(0);
 });
});
