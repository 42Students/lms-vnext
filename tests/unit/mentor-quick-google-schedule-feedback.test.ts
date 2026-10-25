import {describe,expect,it} from "vitest";
import {mentorQuickGoogleScheduleFeedback as feedback}
 from "@/modules/projects/mentor-quick-google-schedule-feedback";

describe("Mentor quick schedule provider outcome honesty",()=>{
 it("never calls an unconfirmed or pending Google Meet draft scheduled",()=>{
  for(const response of [null,{}, {meetingScheduled:false},
   {meetingScheduled:undefined,invitationStatus:"PROVIDER_ACCEPTED"}]){
   const result=feedback(response);
   expect(result.title).toBe("Meeting draft saved");
   expect(result.description).not.toContain("Google accepted the event");
  }
 });
 it("calls an accepted response scheduled without claiming mail delivery",()=>{
  const result=feedback({meetingScheduled:true,invitationStatus:"PROVIDER_ACCEPTED"});
  expect(result.title).toContain("scheduled");
  expect(result.description).toContain("Actual delivery and RSVPs still need");
 });
 it("distinguishes a verified Meet link from failed invite updates",()=>{
  const result=feedback({meetingScheduled:true,invitationStatus:"RETRY_REQUIRED"});
  expect(result.title).toContain("scheduled");
  expect(result.description).toContain("another sync attempt");
 });
});
