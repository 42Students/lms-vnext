import {describe,expect,it} from "vitest";
import {learnerNotificationLoadStatus} from "@/modules/activity/learner-notifications-partial-model";
describe("learner notifications partial source recovery",()=>{
 it("preserves personal inbox when authorized announcements fail",()=>{
   expect(learnerNotificationLoadStatus({
     personalReady:true,announcementsEnabled:true,announcementsFailed:true,
   })).toMatchObject({state:"PARTIAL"});
 });
 it("never represents unreadable personal inbox as a genuine empty inbox",()=>{
   expect(learnerNotificationLoadStatus({
     personalReady:false,announcementsEnabled:true,announcementsFailed:false,
   }).state).toBe("ERROR");
   expect(learnerNotificationLoadStatus({
     personalReady:true,announcementsEnabled:false,announcementsFailed:false,
   }).state).toBe("DISABLED");
 });
});