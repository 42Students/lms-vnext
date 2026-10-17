import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoTeamDecisionSchema} from "@/modules/placements/tpo-team-decision-service";
const src=(p:string)=>readFileSync(p,"utf8");
const threadId="11111111-1111-4111-8111-111111111111",messageId="22222222-2222-4222-8222-222222222222";
describe("TPO Team decisions",()=>{
 it("TPO-inbox-team-23 allows only authorized, optimistic mark and unmark actions",()=>{
  expect(tpoTeamDecisionSchema.safeParse({threadId,messageId,mark:true,expectedMarked:false}).success).toBe(true);
  expect(tpoTeamDecisionSchema.safeParse({threadId,messageId,mark:"yes",expectedMarked:false}).success).toBe(false);
  const service=src("src/modules/placements/tpo-team-decision-service.ts");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("TEAM_STALE_DECISION");
  expect(service).toContain(".for(\"update\")");
  expect(service).toContain("eq(placementTpoInternalMessages.threadId,thread.id)");
  expect(service).toContain("decision_unmarked");
  expect(service).toContain("TEAM_MESSAGE_REMOVED");
 });
 it("TPO-inbox-team-23 renders a pinned decision strip, per-message tag and guarded toggle",()=>{
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  const toggle=src("src/components/tpo/tpo-team-decision-toggle.tsx");
  const route=src("src/app/api/placements/tpo/team/threads/[threadId]/messages/[messageId]/decision/route.ts");
  expect(page).toContain("Decided:");
  expect(page).toContain("message.decision");
  expect(page).toContain("<TpoTeamDecisionToggle");
  expect(toggle).toContain("aria-pressed={marked}");
  expect(toggle).toContain("timeoutMs:12000");
  expect(route).toContain("isSameOriginRequest(request)");
 });
});
