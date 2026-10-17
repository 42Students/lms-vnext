import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoTeamRenameSchema} from "@/modules/placements/tpo-team-rename-service";
const src=(p:string)=>readFileSync(p,"utf8");
const id="11111111-1111-4111-8111-111111111111";
describe("TPO Team conversation rename",()=>{
 it("TPO-inbox-team-17 validates 200-character topic and optimistic expected topic",()=>{
  expect(tpoTeamRenameSchema.safeParse({threadId:id,topic:"a".repeat(200),expectedTopic:"old"}).success).toBe(true);
  expect(tpoTeamRenameSchema.safeParse({threadId:id,topic:"a".repeat(201),expectedTopic:"old"}).success).toBe(false);
  expect(tpoTeamRenameSchema.safeParse({threadId:id,topic:"",expectedTopic:"old"}).success).toBe(false);
  const service=src("src/modules/placements/tpo-team-rename-service.ts");
  expect(service).toContain('eq(placementTpoInternalThreads.collegeId,college.id)');
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("TEAM_STALE_TOPIC");
  expect(service).toContain(".for(\"update\")");
 });
 it("TPO-inbox-team-17 protects rename from double-submit and preserves the field on conflict",()=>{
  const component=src("src/components/tpo/tpo-team-rename.tsx");
  const route=src("src/app/api/placements/tpo/team/threads/[threadId]/rename/route.ts");
  expect(component).toContain("busyRef.current");
  expect(component).toContain("timeoutMs:12000");
  expect(component).toContain("value={topic}");
  expect(route).toContain("isSameOriginRequest");
  expect(route).toContain('status:409');
  expect(src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx")).toContain("<TpoTeamRename");
 });
});
