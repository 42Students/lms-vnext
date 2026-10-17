import {describe,expect,it} from "vitest";
import {TPO_EVERYONE_TITLE,TPO_EVERYONE_DESCRIPTION,TPO_EVERYONE_WELCOME,
 everyoneConversationIsVisible,everyoneMessageSchema,everyoneMuteSchema,
 everyoneNotificationRecipients} from "@/modules/placements/tpo-team-everyone-model";

describe("TPO-inbox-team-15 Everyone conversation",()=>{
 it("TPO-inbox-team-15 exposes Everyone to every active authorized team member, without invitations",()=>{
  expect(TPO_EVERYONE_TITLE).toBe("Everyone");
  expect(TPO_EVERYONE_DESCRIPTION).toBe("Everyone in the placement team, including people who join later. You can mute it, not leave it.");
  expect(TPO_EVERYONE_WELCOME).toMatch(/Welcome to Everyone/);
  expect(everyoneConversationIsVisible({active:true,isTpo:true,canManage:true})).toBe(true);
  expect(everyoneConversationIsVisible({active:false,isTpo:true,canManage:true})).toBe(false);
  expect(everyoneConversationIsVisible({active:true,isTpo:false,canManage:true})).toBe(false);
 });
 it("TPO-inbox-team-15 validates messages and mute-only membership preference",()=>{
  expect(everyoneMessageSchema.safeParse({body:" Update for our team "}).data).toEqual({body:"Update for our team"});
  expect(everyoneMessageSchema.safeParse({body:"  "}).success).toBe(false);
  expect(everyoneMessageSchema.safeParse({body:"x".repeat(4001)}).success).toBe(false);
  expect(everyoneMuteSchema.safeParse({muted:true}).success).toBe(true);
  expect(everyoneMuteSchema.safeParse({muted:true,leave:true}).success).toBe(false);
 });
 it("TPO-inbox-team-15 notifies current, unmuted colleagues only once per user",()=>{
  const recipients=everyoneNotificationRecipients([
   {membershipId:"owner",userId:"u1",muted:false},
   {membershipId:"a",userId:"u2",muted:false},
   {membershipId:"b",userId:"u2",muted:false},
   {membershipId:"c",userId:"u3",muted:true},
  ],"owner");
  expect(recipients.map(row=>row.userId)).toEqual(["u2"]);
 });
});
