import {describe,expect,it} from "vitest";
import {mentorMeetingScheduleError,mentorMeetingHttpUrl,mentorMeetingCeremonyLabel} from "@/modules/projects/mentor-meeting-form-model";
import {mentorMeetingDisplayStatus} from "@/modules/projects/mentor-meeting-display-status";
import {canPageMentorProjectList} from "@/modules/projects/mentor-paged-project-list-model";
import {mentorReviewHistoryPagination,mentorReviewDecisionLabel,mentorReviewHistoryQuerySchema,mentorReviewHistoryLiteralSearch,mentorReviewHistoryHref} from "@/modules/projects/mentor-review-history-model";
import {mentorTaskHistoryPage,mentorTaskHistoryQuerySchema,mentorTaskHistoryHref,taskReviewDecisionLabel} from "@/modules/projects/mentor-task-history-model";
import {mentorTeamHistoryPage,mentorTeamHistoryQuerySchema,classifyMentorTeamMember,mentorTeamHistoryHref} from "@/modules/projects/mentor-team-history-model";
const pid="11111111-1111-4111-8111-111111111111";
const valid={title:"Sprint checkpoint",startsAt:"2028-02-29T23:58",endsAt:"2028-03-01T00:10",meetingUrl:"https://example.edu/meeting",nowMs:Date.parse("2028-02-28T12:00:00.000Z")};

describe("PROJ-BREAK-MENTOR meeting calendar and bounded history semantics",()=>{
 it("PROJ-BREAK-MENTOR-21 rejects impossible leap dates, normalized hours and malformed IST inputs",()=>{
  expect(mentorMeetingScheduleError(valid)).toBeNull();
  for(const invalid of ["2026-02-29T10:00","2028-02-30T10:00","2028-04-31T10:00",
    "2028-00-01T10:00","2028-13-01T10:00","2028-02-29T24:00",
    "2028-02-29T12:60","2028-02-29T10:2","hello"]){
   expect(mentorMeetingScheduleError({...valid,startsAt:invalid}),invalid)
    .toBe("Enter a valid meeting date.");
  }
  for(const invalid of ["2028-02-30T00:10","2028-03-01T25:00",
    "2028-03-01T00:60","2028-02-29T23:57"]){
   expect(mentorMeetingScheduleError({...valid,endsAt:invalid}),invalid)
    .toBe("Meeting end time must be after the start time.");
  }
 });
 it("PROJ-BREAK-MENTOR-23 enforces strict server-instant ordering across IST midnight",()=>{
  const atEndOfDay={...valid,startsAt:"2026-10-18T23:59",endsAt:"2026-10-19T00:01",
   nowMs:Date.parse("2026-10-18T18:28:59.999Z")};
  expect(mentorMeetingScheduleError(atEndOfDay)).toBeNull();
  expect(mentorMeetingScheduleError({...atEndOfDay,nowMs:Date.parse("2026-10-18T18:29:00Z")}))
   .toBe("Meeting date must be in the future.");
  expect(mentorMeetingScheduleError({...atEndOfDay,endsAt:"2026-10-18T23:59"}))
   .toBe("Meeting end time must be after the start time.");
  expect(mentorMeetingScheduleError({...valid,title:"  "}))
   .toBe("Meeting title is required.");
  expect(mentorMeetingScheduleError({...valid,meetingUrl:""}))
   .toBe("Meeting link or physical venue is required.");
  // Physical meetings satisfy scheduling without a Google Meet URL, while an
  // explicit invalid link is still rejected even if a venue is supplied.
  expect(mentorMeetingScheduleError({...valid,meetingUrl:"",location:"Room 304"})).toBeNull();
  expect(mentorMeetingScheduleError({...valid,meetingUrl:"javascript:alert(1)",location:"Room 304"}))
   .toBe("Enter a valid meeting link.");
  expect(mentorMeetingScheduleError({...valid,meetingUrl:"",draft:true})).toBeNull();
 });
 it("PROJ-BREAK-MENTOR-24 meeting links cannot be script/data/file/credential URLs",()=>{
  for(const safe of ["https://example.edu/meeting","http://example.edu/live"]){
   expect(mentorMeetingHttpUrl(safe)).toBe(true);
  }
  for(const hostile of ["javascript:alert(1)","data:text/html,hello","file:///etc/passwd",
    "https://user:password@example.edu/meeting","https://example.edu/"+("x".repeat(2049)),
    "not a url","//example.edu/meeting"]){
   expect(mentorMeetingHttpUrl(hostile),hostile.slice(0,50)).toBe(false);
  }
  expect(mentorMeetingCeremonyLabel("RETRO")).toBe("Retrospective");
  expect(mentorMeetingCeremonyLabel("FORGED")).toBe("General");
  const end=new Date("2026-10-18T18:30:00.000Z");
  expect(mentorMeetingDisplayStatus("SCHEDULED",end,new Date(end.getTime()+1))).toBe("MISSED");
  expect(mentorMeetingDisplayStatus("RESCHEDULED",end,new Date(end.getTime()+1))).toBe("MISSED");
  expect(mentorMeetingDisplayStatus("SCHEDULED",end,end)).toBe("SCHEDULED");
  expect(mentorMeetingDisplayStatus("COMPLETED",end,new Date(end.getTime()+1))).toBe("COMPLETED");
 });
 it("PROJ-BREAK-MENTOR-22 every exported history paginator clamps direct caller abuse",()=>{
  for(const helper of [mentorReviewHistoryPagination,mentorTaskHistoryPage]){
   expect(helper(20,-5)).toMatchObject({page:1,totalPages:1,pageSize:20});
   expect(helper(55,Number.NaN)).toMatchObject({page:1,totalPages:3});
   expect(helper(55,Number.POSITIVE_INFINITY)).toMatchObject({page:1,totalPages:3});
   expect(helper(55,900)).toMatchObject({page:3,totalPages:3});
  }
  expect(mentorTeamHistoryPage(55,-5)).toMatchObject({page:1,totalPages:3,pageSize:20});
  expect(mentorTeamHistoryPage(55,Number.NaN)).toMatchObject({page:1,totalPages:3});
  expect(mentorTeamHistoryPage(55,100,0)).toMatchObject({page:3,pageSize:20});
  expect(mentorTeamHistoryPage(55,100,1000)).toMatchObject({page:3,pageSize:20});
  expect(mentorTeamHistoryPage(55,100,10)).toMatchObject({page:6,pageSize:10});
  expect(mentorReviewHistoryQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(mentorTaskHistoryQuerySchema.safeParse({page:"10001"}).success).toBe(false);
  expect(mentorTeamHistoryQuerySchema.safeParse({projectId:pid,page:-1}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-25 history classification does not call removed learners current",()=>{
  expect(classifyMentorTeamMember({endedAt:new Date(),membershipStatus:"ACTIVE",platformStatus:"ACTIVE"}))
   .toBe("ENDED");
  expect(classifyMentorTeamMember({endedAt:null,membershipStatus:"SUSPENDED",platformStatus:"ACTIVE"}))
   .toBe("INACTIVE");
  expect(classifyMentorTeamMember({endedAt:null,membershipStatus:"ACTIVE",platformStatus:"DISABLED"}))
   .toBe("INACTIVE");
  expect(classifyMentorTeamMember({endedAt:null,membershipStatus:"ACTIVE",platformStatus:"ACTIVE"}))
   .toBe("CURRENT");
  expect(mentorReviewDecisionLabel("APPROVED")).toBe("Approved");
  expect(mentorReviewDecisionLabel("FORGED")).toBe("Recorded review");
  expect(taskReviewDecisionLabel("CHANGES_REQUESTED")).toBe("Changes requested");
  expect(mentorReviewHistoryLiteralSearch("x%_\\")).toBe("x\\%\\_\\\\");
 });
 it("PROJ-BREAK-MENTOR-26 link builders preserve scoped navigation but never leak tenant keys",()=>{
  expect(mentorReviewHistoryHref({decision:"APPROVED",page:2,projectId:pid,search:"security"}))
   .toContain("projectId="+pid);
  expect(mentorTaskHistoryHref({decision:"CHANGES_REQUESTED",search:"needs update",page:3}))
   .toContain("decision=CHANGES_REQUESTED");
  expect(mentorTeamHistoryHref(pid,{view:"ENDED",page:2,role:"LEARNER"}))
   .toContain("/mentor/projects/"+pid+"/team-history?");
  for(const href of [
   mentorReviewHistoryHref({decision:"APPROVED",page:2,projectId:pid,search:"security"}),
   mentorTaskHistoryHref({decision:"CHANGES_REQUESTED",search:"needs update",page:3}),
   mentorTeamHistoryHref(pid,{view:"ENDED",page:2,role:"LEARNER"}),
  ])expect(href).not.toMatch(/(?:collegeId|organizationId|actorId)=/);
  expect(canPageMentorProjectList({attention:undefined,work:undefined,status:"ACTIVE",sort:"RECENT"}))
   .toBe(true);
  expect(canPageMentorProjectList({attention:"REVIEW" as never,work:undefined,status:"ACTIVE",sort:"RECENT"}))
   .toBe(false);
  expect(canPageMentorProjectList({attention:undefined,work:undefined,status:"BLOCKED",sort:"TITLE"}))
   .toBe(false);
 });
});
