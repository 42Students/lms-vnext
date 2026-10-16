import {describe,expect,it} from "vitest";
import {hrReplyValidationError,hrReplyErrorMessage,HR_REPLY_REFRESH_FAILED,HR_REPLY_SEND_FAILED} from "@/modules/placements/hr-conversation-send-feedback-model";

describe("REC-calendar-messages-profile-15 exact legacy send and validation copy",()=>{
 it("blocks a blank or whitespace-only message",()=>{
  expect(hrReplyValidationError("")).toBe("Write a message first");
  expect(hrReplyValidationError("   ")).toBe("Write a message first");
 });
 it("rejects over 4000 characters and accepts boundary length",()=>{
  expect(hrReplyValidationError("x".repeat(4001))).toBe("Keep a message under 4000 characters");
  expect(hrReplyValidationError("x".repeat(4000))).toBeNull();
  expect(hrReplyValidationError("Hello placement cell")).toBeNull();
 });
 it("preserves legacy failure copy, including refresh errors",()=>{
  expect(HR_REPLY_SEND_FAILED).toBe("Could not send");
  expect(hrReplyErrorMessage(400)).toBe("Could not send");
  expect(HR_REPLY_REFRESH_FAILED).toBe("Message sent, but the conversation could not refresh. Retry to load the latest messages.");
 });
});
