import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-3-022-026 legacy TPO group conversation mentions",()=>{
 const send=readFileSync("src/modules/placements/tpo-team-conversation-service.ts","utf8");
 const writer=readFileSync("src/modules/placements/tpo-team-internal-reply-service.ts","utf8");
 it("forwards group mentions and Add people confirmation to scoped transactional writer",()=>{
  expect(send).toContain("mentionMembershipIds:input.mentionMembershipIds");
  expect(send).toContain("addMentionedMembers:input.addMentionedMembers");
  expect(send).not.toContain("const authorized=new Set(");
 });
 it("accepts the bounded group kind and member list when starting a new conversation",()=>{
  expect(send).toContain('kind:z.enum(["DIRECT","TOPIC","DRIVE","COMPANY"]).default("DIRECT")');
  expect(send).toContain("participantMembershipIds:z.array(z.string().uuid()).max(20).default([])");
  expect(send).toContain("participantMembershipIds:input.participantMembershipIds");
  expect(send).toContain("kind:input.kind,contextId:input.contextId");
  expect(send).toContain('input.kind!=="DIRECT"||input.contextId||input.participantMembershipIds.length');
 });
 it("checks persisted active college membership and group roster before notification",()=>{
  expect(writer).toContain("new Set(active.map(member=>member.id)).size!==memberIds.length");
  expect(writer).toContain("requestedMentions.some(id=>!mentionNames.has(id))");
  expect(writer).toContain("if(!input.addMentionedMembers)");
  expect(writer).toContain("throw new TeamAddPeopleRequiredError(");
 });
});
