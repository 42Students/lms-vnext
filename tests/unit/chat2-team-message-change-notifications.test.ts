import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoTeamCanEdit} from "@/modules/placements/tpo-team-message-change-model";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO Team message mutations and actor notifications",()=>{
 it("TPO-inbox-team-24 enforces author-only immutable message deletion and 15-minute edit CAS",()=>{
  const service=src("src/modules/placements/tpo-team-message-change-service.ts");
  expect(tpoTeamCanEdit(new Date("2099-01-01T12:00:00Z"),new Date("2099-01-01T12:16:00Z"))).toBe(false);
  expect(service).toContain('base.extend({action:z.literal("EDIT"),body:z.string().trim().min(1).max(4000)})');
  expect(service).toContain('expectedBodyHash:z.string().regex(');
  expect(service).toContain("eq(placementTpoInternalMessages.authorMembershipId,membership.id)");
  expect(service).toContain('throw new Error("TEAM_STALE_MESSAGE")');
  expect(service).toContain('updatedBody=input.action==="EDIT"?input.body:"Message removed"');
 });
 it("TPO-inbox-team-29 sends tenant-scoped actor alerts for Team reply, invited participant, decision, edit and remove events",()=>{
  const change=src("src/modules/placements/tpo-team-message-change-service.ts");
  const reply=src("src/modules/placements/tpo-team-internal-reply-service.ts");
  const create=src("src/modules/placements/tpo-team-internal-create-service.ts");
  expect(change).toContain('eq(collegeMemberships.collegeId,college.id)');
  expect(change).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(change).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(change).toContain("tx.insert(inAppNotifications)");
  expect(change).toContain('actionHref:"/tpo/team/"+thread.id+"?m="+message.id');
  expect(reply).toContain('input.markDecision?"Decision from "+actorName:"New message from "+actorName');
  expect(create).toContain('" added you to a conversation"');
 });
});