import { describe, expect, it } from "vitest";
import { canRemindRecruiterInvite, recruiterInviteReminderPatch } from "@/modules/placements/tpo-recruiter-invite-policy";
const at=new Date("2026-10-10T10:00:00Z");
const day4=new Date("2026-10-14T10:00:00Z");
const base={inviteTokenHash:"a".repeat(64),inviteSentAt:at,
  recruiterUserId:null,unsubscribedAt:null,manualStage:"NEW",
  inviteClickedAt:null,inviteReminderSentAt:null,emailNorm:"recruiter@example.org"};
describe("T-S2-03 one-time recruiter reminder",()=>{
 it("permits day four only without a click, prior reminder or human contact",()=>{
  expect(canRemindRecruiterInvite(base,false,day4)).toBe(true);
  expect(canRemindRecruiterInvite(base,true,day4)).toBe(false);
  expect(canRemindRecruiterInvite({...base,inviteClickedAt:at},false,day4)).toBe(false);
  expect(canRemindRecruiterInvite({...base,inviteReminderSentAt:day4},false,day4)).toBe(false);
  expect(canRemindRecruiterInvite(base,false,new Date(at.getTime()+7*24*60*60*1000))).toBe(false);
 });
 it("rotation does not write inviteSentAt or reset first open",()=>{
  const patch=recruiterInviteReminderPatch("b".repeat(64),day4);
  expect(patch).toEqual({
    inviteTokenHash:"b".repeat(64),inviteReminderSentAt:day4,updatedAt:day4,
  });
  expect(Object.keys(patch)).not.toContain("inviteSentAt");
  expect(Object.keys(patch)).not.toContain("inviteClickedAt");
 });
});
