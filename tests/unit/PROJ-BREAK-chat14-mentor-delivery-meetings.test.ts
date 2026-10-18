import {describe,expect,it} from "vitest";
import {mentorReviewOverviewSchema,mentorReviewOverviewHref,classifyMentorDeliveryReview,
 mentorDeliveryReviewCounts,mentorDeliveryReviewCsv} from "@/modules/projects/mentor-review-overview-model";
import {mentorTeamMeetingsQuerySchema,escapeMentorMeetingSearch,mentorTeamMeetingsPage,mentorTeamMeetingsHref}
 from "@/modules/projects/mentor-team-meetings-model";
import {singleValueMentorFilters,singleValueMentorExportFilters}
 from "@/modules/projects/mentor-filter-query";

const pid="11111111-1111-4111-8111-111111111111";
const q=(x:Record<string,unknown>={})=>mentorReviewOverviewSchema.parse({projectId:pid,...x});
const meeting=(x:Record<string,unknown>={})=>mentorTeamMeetingsQuerySchema.parse({projectId:pid,...x});

describe("PROJ-BREAK-MENTOR-59..63 persisted review evidence, paged meeting data and export URL safety",()=>{
 it("PROJ-BREAK-MENTOR-59 counts only the two persisted review decisions, no forged/future states",()=>{
  const rows=[
   {decision:null,feedbackPresent:false},
   {decision:"APPROVED",feedbackPresent:false},
   {decision:"CHANGES_REQUESTED",feedbackPresent:true},
   {decision:"FUTURE_STATUS",feedbackPresent:true},
  ];
  expect(mentorDeliveryReviewCounts(rows)).toEqual({reviewed:2,withFeedback:1});
  expect(classifyMentorDeliveryReview({status:"DRAFT",decision:"APPROVED",feedbackPresent:true}))
   .toBe("Draft — not submitted");
  expect(classifyMentorDeliveryReview({status:"SUBMITTED",decision:null,feedbackPresent:false}))
   .toBe("Awaiting review");
  expect(classifyMentorDeliveryReview({status:"APPROVED",decision:"APPROVED",feedbackPresent:true}))
   .toBe("Approved — feedback recorded");
  expect(classifyMentorDeliveryReview({status:"SUBMITTED",decision:"UNKNOWN",feedbackPresent:false}))
   .toBe("No recorded review decision");
 });
 it("PROJ-BREAK-MENTOR-60 delivery audit export caps 200 and neutralizes formulas and invalid dates",()=>{
  const records=Array.from({length:204},(_,i)=>({
   id:"delivery-"+i,version:i+1,status:"SUBMITTED",
   reviewLabel:i===0?"=WEBSERVICE(\"https://invalid\")":"Review",feedbackPresent:false,
   submittedAt:i===0?new Date(NaN):new Date("2026-10-18T10:00:00.000Z"),
   reviewedAt:null,
  }));
  const csv=mentorDeliveryReviewCsv(records,2);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(202);
  expect(csv).toContain("6 additional matching versions");
  expect(csv).toContain("Not recorded");
  expect(csv).toContain("'=WEBSERVICE");
  expect(csv).not.toContain("delivery-203");
  expect(csv).not.toContain("learner_email");
  expect(mentorDeliveryReviewCsv([],Number.NaN)).not.toContain("Truncated");
 });
 it("PROJ-BREAK-MENTOR-61 meeting history is bounded even for direct invalid page input",()=>{
  expect(mentorTeamMeetingsPage(0,NaN)).toMatchObject({page:1,totalPages:1});
  expect(mentorTeamMeetingsPage(41,-100)).toMatchObject({page:1,totalPages:3});
  expect(mentorTeamMeetingsPage(41,100)).toMatchObject({page:3,totalPages:3});
  expect(mentorTeamMeetingsQuerySchema.safeParse({projectId:pid,status:"NOT_A_STATUS"}).success)
   .toBe(false);
  expect(mentorTeamMeetingsQuerySchema.safeParse({projectId:pid,actorId:pid}).success)
   .toBe(false);
  expect(mentorTeamMeetingsQuerySchema.safeParse({projectId:pid,page:10001}).success)
   .toBe(false);
  expect(meeting({outcome:"NOT_RECORDED",page:2}).outcome).toBe("NOT_RECORDED");
 });
 it("PROJ-BREAK-MENTOR-62 history and review deep links retain only approved query fields",()=>{
  const review=mentorReviewOverviewHref(q({status:"APPROVED",feedback:"WITH",page:2}));
  expect(review).toContain("status=APPROVED");
  expect(review).toContain("feedback=WITH");
  expect(review).toContain("page=2");
  const href=mentorTeamMeetingsHref(meeting({type:"RETRO",status:"COMPLETED",page:2,search:"team"}));
  expect(href).toContain("type=RETRO");
  expect(href).toContain("status=COMPLETED");
  expect(href).toContain("page=2");
  expect(href).toContain("/mentor/projects/"+pid);
  for(const url of [review,href])expect(url).not.toMatch(/(?:collegeId|actorId|organizationId)=/);
  expect(mentorReviewOverviewSchema.safeParse({projectId:pid,collegeId:pid}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:pid,version:-1}).success).toBe(false);
  expect(mentorReviewOverviewSchema.safeParse({projectId:pid,page:"10001"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-63 duplicated/forged search filters cannot select a narrower identity",()=>{
  expect(escapeMentorMeetingSearch("50%_\\")).toBe("50\\%\\_\\\\");
  expect(singleValueMentorFilters({search:["relevant","private"]})).toBeNull();
  expect(singleValueMentorFilters({search:["relevant"]})).toEqual({search:"relevant"});
  expect(singleValueMentorFilters({search:"safe",adminId:"forged"})).toEqual({search:"safe"});
  const filters=new URLSearchParams("status=APPROVED&status=SUBMITTED");
  expect(singleValueMentorExportFilters(filters,["status"])).toBeNull();
  expect(singleValueMentorExportFilters(new URLSearchParams("status=APPROVED&collegeId=foreign"),
   ["status"])).toBeNull();
  expect(singleValueMentorExportFilters(new URLSearchParams("status=APPROVED"),["status"]))
   .toEqual({status:"APPROVED"});
 });
});
