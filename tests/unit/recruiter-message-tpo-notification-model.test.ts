import {describe,it,expect} from "vitest";
import {recruiterMessageTpoRecipients,recruiterMessageTpoHref,
 RECRUITER_MESSAGE_TPO_TITLE} from "@/modules/placements/recruiter-message-tpo-notification-model";
describe("REC-calendar-messages-profile-17 TPO bell receipt",()=>{
 it("deduplicates recipients and prevents a sender notifying themself",()=>{
  expect(recruiterMessageTpoRecipients([{userId:"a"},{userId:"b"},{userId:"a"}],"b")).toEqual(["a"]);
 });
 it("uses the registered notification inbox with exact legacy title",()=>{
  expect(RECRUITER_MESSAGE_TPO_TITLE).toBe("New message from a recruiter");
  const threadId="00000000-0000-4000-8000-000000000001";
  expect(recruiterMessageTpoHref(threadId)).toBe("/tpo/messages/"+threadId);
  expect(recruiterMessageTpoHref("not-a-thread")).toBe("/tpo/messages");
 });
});
