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
  it("preserves validated class/course filters and legacy course-slug precedence",()=>{
    const classId="11111111-1111-4111-8111-111111111111";
    const courseId="22222222-2222-4222-8222-222222222222";
    const withSlug=learnerNotificationInboxHref({classId,courseId,courseSlug:"crs-safe"});
    expect(withSlug).toBe("/learn/notifications?classId="+classId+"&courseSlug=crs-safe");
    expect(learnerNotificationInboxHref({classId,courseId})).toBe(
      "/learn/notifications?classId="+classId+"&courseId="+courseId);
    expect(()=>learnerNotificationInboxHref({courseSlug:"../foreign"})).toThrow();
    expect(()=>learnerNotificationInboxHref({classId:"foreign"})).toThrow();
  });
  it("never carries actor selectors or unauthorized query data",()=>{
    for(const value of [{collegeId:"foreign"},{q:"x".repeat(101)},
      {category:"hr"},{unread:"maybe"}])
      expect(()=>learnerNotificationInboxHref(value)).toThrow();
    expect(learnerNotificationInboxHref({})).toBe("/learn/notifications");
  });
});