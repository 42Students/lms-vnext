import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoTeamCanEdit} from "@/modules/placements/tpo-team-message-change-model";
import {tpoTeamMessageChangeSchema} from "@/modules/placements/tpo-team-message-change-service";
const src=(p:string)=>readFileSync(p,"utf8");
const threadId="11111111-1111-4111-8111-111111111111",messageId="22222222-2222-4222-8222-222222222222",expectedBodyHash="a".repeat(64);
describe("TPO Team message edit and removal",()=>{
 it("TPO-inbox-team-24 edits only in a fifteen-minute window",()=>{
  const now=new Date("2099-01-01T12:00:00Z");
  expect(tpoTeamCanEdit(new Date("2099-01-01T11:45:00Z"),now)).toBe(true);
  expect(tpoTeamCanEdit(new Date("2099-01-01T11:44:59Z"),now)).toBe(false);
  expect(tpoTeamCanEdit(new Date("2099-01-01T12:00:01Z"),now)).toBe(false);
  expect(tpoTeamMessageChangeSchema.safeParse({threadId,messageId,expectedBodyHash,action:"EDIT",body:"Hello"}).success).toBe(true);
  expect(tpoTeamMessageChangeSchema.safeParse({threadId,messageId,expectedBodyHash,action:"EDIT",body:" "}).success).toBe(false);
  expect(tpoTeamMessageChangeSchema.safeParse({threadId,messageId,expectedBodyHash,action:"DELETE",body:"malicious"}).success).toBe(false);
 });
 it("TPO-inbox-team-24 locks the original author and scoped message during an optimistic mutation",()=>{
  const service=src("src/modules/placements/tpo-team-message-change-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("eq(placementTpoInternalMessages.authorMembershipId,membership.id)");
  expect(service).toContain("eq(placementTpoInternalMessages.collegeId,college.id)");
  expect(service).toContain("expectedBodyHash");
  expect(service).toContain("TEAM_STALE_MESSAGE");
  expect(service).toContain('.for("update")');
  expect(service).toContain('metadata:{messageId:message.id}');
  const route=src("src/app/api/placements/tpo/team/threads/[threadId]/messages/[messageId]/change/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("status:409");
 });
 it("TPO-inbox-team-25 retains removed and edited state in thread rendering with guarded drafts",()=>{
  const read=src("src/modules/placements/tpo-team-conversation-service.ts");
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const controls=src("src/components/tpo/tpo-team-message-actions.tsx");
  expect(read).toContain("edited: sql<boolean>");
  expect(read).toContain("removed: sql<boolean>");
  expect(page).toContain("message.removed?");
  expect(page).toContain("<TpoTeamMessageActions");
  expect(controls).toContain("pending.current");
  expect(controls).toContain("timeoutMs:12000");
  expect(controls).toContain('role="alertdialog"');
 });
});
