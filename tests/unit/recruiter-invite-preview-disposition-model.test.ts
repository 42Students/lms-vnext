import {describe,it,expect} from "vitest";
import {recruiterInvitePreviewDisposition,RECRUITER_INVITE_LOAD_ERROR_HEADING} from "@/modules/placements/recruiter-invite-preview-disposition-model";
describe("REC-calendar-messages-profile-40 preview error vs invalid state",()=>{
 it("never tells recruiter their invite is expired on network/HTTP 500",()=>{
  expect(recruiterInvitePreviewDisposition(500,false)).toBe("load_error");
  expect(recruiterInvitePreviewDisposition(503,false)).toBe("load_error");
  expect(recruiterInvitePreviewDisposition(200,false)).toBe("load_error");
 });
 it("distinguishes invalid link from valid preview",()=>{
  expect(recruiterInvitePreviewDisposition(404,false)).toBe("invalid");
  expect(recruiterInvitePreviewDisposition(410,false)).toBe("invalid");
  expect(recruiterInvitePreviewDisposition(200,true)).toBe("ready");
 });
});

it("REC-calendar-messages-profile-40 uses the exact recoverable error heading",()=>{
 expect(RECRUITER_INVITE_LOAD_ERROR_HEADING).toBe("We couldn't load this invitation");
});
