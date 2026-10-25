import {describe,expect,it} from "vitest";
import {deriveMentorProjectAttention,type MentorProjectAttention} from "@/modules/projects/mentor-attention";
import {mentorAttentionProjectOptions,selectMentorAttention,mentorAttentionProjectSchema} from "@/modules/projects/mentor-attention-kind-model";
import {matchesMentorProjectAttention} from "@/modules/projects/mentor-project-attention-filter-model";
import {projectMentorWorkloadAverage,isProjectMentorOverloaded} from "@/modules/projects/mentor-overload-model";
import {mentorTaskReviewQuerySchema,mentorTaskReviewLiteralSearch,mentorTaskReviewTargetHref,mentorTaskReviewHref,mentorTaskReviewSummary,mentorTaskReviewAgeBoundary,mentorTaskReviewExportHref} from "@/modules/projects/mentor-task-review-model";
import {mentorSprintProgressQuerySchema,mentorSprintProgressPage,summarizeSprintTasks,mentorSprintProgressHref} from "@/modules/projects/mentor-sprint-progress-model";
import {mentorTaskQuickActionLabel} from "@/modules/projects/mentor-task-quick-action-copy";
import {maySaveMentorMeetingStatus,mentorScheduleStatusFromMeeting} from "@/modules/projects/mentor-meeting-status-model";
import {mentorMeetingHttpUrl,mentorMeetingScheduleError,mentorMeetingCeremonyLabel} from "@/modules/projects/mentor-meeting-form-model";

const a="123e4567-e89b-42d3-a456-426614174000",b="123e4567-e89b-42d3-a456-426614174001";
const now=new Date("2026-10-18T04:30:00Z");
const source=(status:string)=>{
 return {projectId:a,projectTitle:"Platform",projectStatus:status,
  projectUpdatedAt:new Date("2026-10-01T04:00:00Z"),lastActivityAt:null,
  submission:{id:b,status:"SUBMITTED",submittedAt:new Date("2026-10-18T04:00:00Z")},
  meetings:[{id:"requested",status:"REQUESTED",title:"Weekly sync",startsAt:new Date("2026-10-18T03:30:00Z")},
   {id:"soon",status:"SCHEDULED",title:"Demo",startsAt:new Date("2026-10-18T05:00:00Z")}],
 };
};

describe("chat-14 mentor attention risk and workflow policies",()=>{
 it("derives review, stalled, request and upcoming alerts only for visible active projects",()=>{
   const alerts=deriveMentorProjectAttention([source("ACTIVE")],now);
   expect(new Set(alerts.map(item=>item.kind))).toEqual(new Set(["REVIEW","STALLED","REQUESTED","MEETING_SOON"]));
   expect(alerts.every(item=>item.href.startsWith("/mentor/projects/"+a))).toBe(true);
   expect(deriveMentorProjectAttention([source("ARCHIVED")],now)).toEqual([]);
 });
 it("does not flag completed, blocked or recently active projects as stalled",()=>{
   for(const status of ["COMPLETED","BLOCKED"]){
     expect(deriveMentorProjectAttention([source(status)],now).some(item=>item.kind==="STALLED")).toBe(false);
   }
   expect(deriveMentorProjectAttention([{...source("ACTIVE"),lastActivityAt:now}],now).some(item=>item.kind==="STALLED")).toBe(false);
 });
 it("orders review alerts before lower priority requests when review-first is selected",()=>{
   const alerts=deriveMentorProjectAttention([source("ACTIVE")],now);
   const ordered=selectMentorAttention(alerts,"ALL",undefined,"REVIEW_FIRST");
   expect(ordered[0].kind).toBe("REVIEW");
   expect(ordered.map(item=>item.kind)).toEqual(["REVIEW","REQUESTED","STALLED","MEETING_SOON"]);
   expect(selectMentorAttention(alerts,"REVIEW").every(item=>item.kind==="REVIEW")).toBe(true);
 });
 it("only exposes project options from the authenticated mentor roster",()=>{
   const forged:MentorProjectAttention={projectId:b,key:"review:forged",kind:"REVIEW",
    title:"Forged alert",description:"Unscoped",href:"/admin",occurredAt:now.toISOString()};
   const opts=mentorAttentionProjectOptions([forged], [{id:a,title:"Platform"}]);
   expect(opts).toEqual([]);
   expect(mentorAttentionProjectSchema.safeParse("not-a-uuid").success).toBe(false);
   expect(mentorAttentionProjectSchema.parse("")).toBeUndefined();
 });
 it("keeps project attention flags role-specific and supports no-attention",()=>{
   const present=new Set(["REVIEW","STALLED"]);
   expect(matchesMentorProjectAttention("MENTOR_REVIEW",present)).toBe(true);
   expect(matchesMentorProjectAttention("MENTOR_MEETING_SOON",present)).toBe(false);
   expect(matchesMentorProjectAttention("MENTOR_ANY_ATTENTION",present)).toBe(true);
   expect(matchesMentorProjectAttention("MENTOR_NO_ATTENTION",present)).toBe(false);
   expect(matchesMentorProjectAttention("MENTOR_NO_ATTENTION",undefined)).toBe(true);
   expect(matchesMentorProjectAttention("LEARNER_ACTION",present)).toBe(false);
 });
 it("requires the legacy 150% average and three extra assignments for overload",()=>{
   expect(projectMentorWorkloadAverage([])).toBe(0);
   expect(projectMentorWorkloadAverage([-3,2,4])).toBe(2);
   // The legacy overload flag also requires at least three more assignments than the mean.
   expect(isProjectMentorOverloaded(5,[1,1,5])).toBe(false);
   expect(isProjectMentorOverloaded(6,[1,1,5])).toBe(true);
   expect(isProjectMentorOverloaded(3,[1,1,4])).toBe(false);
   expect(isProjectMentorOverloaded(1,[0,0])).toBe(false);
 });
 it("restricts task review paging and project selectors at the URL boundary",()=>{
   expect(mentorTaskReviewQuerySchema.safeParse({page:10001}).success).toBe(false);
   expect(mentorTaskReviewQuerySchema.safeParse({projectId:"forged"}).success).toBe(false);
   expect(mentorTaskReviewQuerySchema.safeParse({collegeId:b}).success).toBe(false);
   expect(mentorTaskReviewQuerySchema.parse({pageSize:"20"}).pageSize).toBe(20);
 });
 it("escapes SQL LIKE wildcard search and builds only validated task targets",()=>{
   expect(mentorTaskReviewLiteralSearch("%_")).toBe("\\%\\_");
   expect(mentorTaskReviewTargetHref(a,b)).toBe("/mentor/projects/"+a+"?tab=board#mentor-task-"+b);
   expect(()=>mentorTaskReviewTargetHref("invalid",b)).toThrow();
 });
 it("retains review filters across paging and exports the full selected scope",()=>{
   const url=mentorTaskReviewHref({priority:"HIGH",age:"OLDER_THAN_30_DAYS",page:3,projectId:a});
   expect(url).toContain("priority=HIGH");
   expect(url).toContain("page=3");
   expect(mentorTaskReviewExportHref({priority:"HIGH",age:"OLDER_THAN_30_DAYS"})).toBe("/api/mentor/task-reviews/export?priority=HIGH&age=OLDER_THAN_30_DAYS");
   expect(mentorTaskReviewSummary({total:0,page:5,pageSize:20}).first).toBe(0);
   expect(mentorTaskReviewSummary({total:42,page:9,pageSize:20}).page).toBe(3);
 });
 it("uses precise age cutoffs with distinct recent and older-than predicates",()=>{
   expect(mentorTaskReviewAgeBoundary("ALL",now)).toBeNull();
   expect(mentorTaskReviewAgeBoundary("LAST_7_DAYS",now)?.older).toBe(false);
   expect(mentorTaskReviewAgeBoundary("OLDER_THAN_7_DAYS",now)?.older).toBe(true);
   expect(mentorTaskReviewAgeBoundary("OLDER_THAN_30_DAYS",now)?.cutoff.getTime()).toBe(now.getTime()-30*86400000);
 });
 it("separates rounded legacy display progress from exact completion status",()=>{
   expect(summarizeSprintTasks([{status:"DONE",total:999},{status:"TODO",total:1}])).toEqual({
     total:1000,completed:999,inReview:0,blocked:0,completionPercent:100,
   });
   expect(summarizeSprintTasks([{status:"IN_REVIEW",total:1},{status:"BLOCKED",total:2}]).completionPercent).toBe(0);
   expect(summarizeSprintTasks([]).completionPercent).toBeNull();
 });
 it("bounds sprint progress pages and encodes filters without forged selectors",()=>{
   expect(mentorSprintProgressPage(41,9)).toEqual({total:41,page:3,pageSize:20,totalPages:3});
   expect(mentorSprintProgressQuerySchema.safeParse({tenantId:b}).success).toBe(false);
   const url=mentorSprintProgressHref({state:"ACTIVE",search:"demo",page:2,release:"IN_PROGRESS",projectId:a});
   expect(url).toContain("state=ACTIVE");
   expect(url).toContain("page=2");
   expect(url).toContain("release=IN_PROGRESS");
 });
 it("keeps the legacy task quick-action wording",()=>{
   expect(mentorTaskQuickActionLabel("IN_PROGRESS")).toBe("Move to in progress");
   expect(mentorTaskQuickActionLabel("BLOCKED")).toBe("Flag as blocked");
   expect(mentorTaskQuickActionLabel("IN_REVIEW")).toBe("Move to review");
   expect(mentorTaskQuickActionLabel("DONE")).toBe("Mark complete");
   expect(mentorTaskQuickActionLabel("TODO")).toBe("Move to do");
 });
 it("meeting scheduler forbids editing completed/cancelled meetings and supports rescheduling",()=>{
   expect(maySaveMentorMeetingStatus(null,"DRAFT",false)).toBe(true);
   expect(maySaveMentorMeetingStatus("REQUESTED","SCHEDULED",true)).toBe(true);
   expect(maySaveMentorMeetingStatus("SCHEDULED","SCHEDULED",true)).toBe(false);
   expect(maySaveMentorMeetingStatus("SCHEDULED","RESCHEDULED",true)).toBe(true);
   expect(maySaveMentorMeetingStatus("COMPLETED","SCHEDULED",false)).toBe(false);
   expect(mentorScheduleStatusFromMeeting("DRAFT")).toBe("DRAFT");
 });
 it("meeting form applies IST time ordering, URL validation, and draft link exemption",()=>{
   const base={title:"Sprint review",startsAt:"2099-01-01T10:00",endsAt:"2099-01-01T11:00",meetingUrl:"https://example.org/join",nowMs:now.getTime()};
   expect(mentorMeetingScheduleError(base)).toBeNull();
   expect(mentorMeetingScheduleError({...base,title:" "})).toBe("Meeting title is required.");
   expect(mentorMeetingScheduleError({...base,endsAt:"2099-01-01T09:00"})).toBe("Meeting end time must be after the start time.");
   expect(mentorMeetingScheduleError({...base,meetingUrl:""})).toBe("Meeting link or physical venue is required.");
   expect(mentorMeetingScheduleError({...base,meetingUrl:"",draft:true})).toBeNull();
   expect(mentorMeetingHttpUrl("javascript:alert(1)")).toBe(false);
   expect(mentorMeetingHttpUrl("https://user:pass@example.org")).toBe(false);
   expect(mentorMeetingCeremonyLabel("RETRO")).toBe("Retrospective");
 });
});
