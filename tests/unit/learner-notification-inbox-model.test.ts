import {describe,expect,it} from "vitest";
import {filterLearnerInbox,learnerExternalAssessmentLaunch,learnerNotificationInboxQuerySchema,learnerNotificationTarget} from "@/modules/activity/learner-notification-inbox-model";
const items=[
  {title:"Interview",body:"Upcoming interview",module:"PLACEMENTS",readAt:null},
  {title:"Quiz",body:"Grade posted",module:"COURSES",readAt:"2026-10-14T00:00:00Z"},
  {title:"Notice",body:"Campus",module:"ANNOUNCEMENTS",readAt:null,source:"ANNOUNCEMENT" as const},
];
describe("learner notification inbox filters",()=>{
  it("filters category, unread and text without treating announcements as personal unread",()=>{
    expect(filterLearnerInbox(items,{category:"job",unread:"unread"}).map(x=>x.title)).toEqual(["Interview"]);
    expect(filterLearnerInbox(items,{category:"general",unread:"unread"})).toEqual([]);
    expect(filterLearnerInbox(items,{q:"grade"}).map(x=>x.title)).toEqual(["Quiz"]);
  });
  it("opens only validated external assessment URLs in the same tab",()=>{
    expect(learnerExternalAssessmentLaunch("https://assessment.example.com/start"))
      .toEqual({href:"https://assessment.example.com/start"});
    for(const unsafe of ["javascript:alert(1)","https://user:pass@assessment.example.com/",
      "https://assessment.example.com/\\n", "//evil.example.com"]){
      expect(learnerExternalAssessmentLaunch(unsafe)).toBeNull();
    }
  });
  it("rejects caller selectors and unsafe target links",()=>{
    expect(learnerNotificationInboxQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
    expect(learnerNotificationInboxQuerySchema.safeParse({category:["job"]}).success).toBe(false);
    expect(learnerNotificationTarget("/learn/my-placements/interviews")).toBe("/learn/my-placements/interviews");
    expect(learnerNotificationTarget("/tpo/reports")).toBeNull();
    expect(learnerNotificationTarget("//evil.example")).toBeNull();
  });
});