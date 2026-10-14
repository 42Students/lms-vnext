import {describe,expect,it} from "vitest";
import {learnerNotificationInboxHref,learnerNotificationInboxQuerySchema,
filterLearnerInbox} from "@/modules/activity/learner-notification-inbox-model";
const own=[
  {title:"New interview",body:"Scheduled in IST",module:"PLACEMENTS",readAt:null},
  {title:"Course update",body:"Lecture added",module:"COURSES",readAt:"2026-10-14T06:00:00Z"},
];
describe("learner inbox URL filters",()=>{
  it("restores category, unread and bounded text in a valid shareable URL",()=>{
    const href=learnerNotificationInboxHref({category:"job",unread:"unread",q:"  interview  "});
    expect(href).toBe("/learn/notifications?category=job&unread=unread&q=interview");
    const parsed=learnerNotificationInboxQuerySchema.parse(Object.fromEntries(
      new URL(href,"https://lms.invalid").searchParams.entries()));
    expect(filterLearnerInbox(own,parsed)).toHaveLength(1);
  });
  it("never carries actor selectors or unauthorized query data",()=>{
    for(const value of [{collegeId:"foreign"},{q:"x".repeat(101)},
      {category:"hr"},{unread:"maybe"}])
      expect(()=>learnerNotificationInboxHref(value)).toThrow();
    expect(learnerNotificationInboxHref({})).toBe("/learn/notifications");
  });
});