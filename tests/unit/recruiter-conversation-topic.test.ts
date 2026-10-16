import {describe,expect,it} from "vitest";
import {hrRecruiterConversationTopic,hrRecruiterConversationDriveHref} from "@/modules/placements/hr-conversation-topic-model";
describe("REC-calendar-messages-profile-R02 thread topic",()=>{
 it("keeps General separate from any drive",()=>{
  expect(hrRecruiterConversationTopic(null,null)).toBe("General");
  expect(hrRecruiterConversationDriveHref(null)).toBeNull();
 });
 it("shows the authorized drive title and links to its discussion",()=>{
  const id="00000000-0000-4000-8000-000000000001";
  expect(hrRecruiterConversationTopic(id,"Software Engineer")).toBe("Software Engineer");
  expect(hrRecruiterConversationDriveHref(id)).toBe("/recruiter/drives/"+id+"?tab=messages");
 });
 it("uses a safe fallback when the job title is unavailable",()=>{
  expect(hrRecruiterConversationTopic("id",null)).toBe("Hiring drive");
  expect(hrRecruiterConversationTopic("id","  ")).toBe("Hiring drive");
 });
});
