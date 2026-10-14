import {describe,expect,it} from "vitest";
import {learnerNotificationPendingCount,learnerNotificationReadAllSchema}
from "@/modules/activity/learner-notification-read-all-model";
describe("personal notification bulk acknowledgement",()=>{
  it("only counts unread personal records and never college announcements",()=>{
    expect(learnerNotificationPendingCount([
      {readAt:null},{readAt:"2026-10-14T00:00:00Z"},
      {readAt:null,source:"ANNOUNCEMENT"},
    ])).toBe(1);
  });
  it("requires explicit confirmation and rejects recipient/college selectors",()=>{
    expect(learnerNotificationReadAllSchema.parse({confirmed:true})).toEqual({confirmed:true});
    for(const raw of [{confirmed:false},{confirmed:true,userId:"foreign"},{confirmed:true,collegeId:"foreign"}])
      expect(()=>learnerNotificationReadAllSchema.parse(raw)).toThrow();
  });
});