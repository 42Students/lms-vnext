import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoAuditActorLabel} from "@/modules/placements/tpo-audit-model";
const source=readFileSync(new URL("../../src/modules/placements/tpo-audit-service.ts",import.meta.url),"utf8");
describe("TPO-settings-audit-90 actor column",()=>{
 it("returns the display name without exposing internal UUIDs",()=>{
  expect(tpoAuditActorLabel("  Priya Sharma ")).toBe("Priya Sharma");
  expect(tpoAuditActorLabel(null)).toBe("System");
  expect(tpoAuditActorLabel(null,"TPO")).toBe("Placement team");
  expect(tpoAuditActorLabel("  ")).toBe("System");
 });
 it("keeps each union source tenant-bound with a single actor field",()=>{
  expect((source.match(/as actor_user_id/g)??[]).length).toBe(9);
  expect(source).toContain("left join users actor on actor.id = record.actor_user_id");
  expect(source).toContain("actor.display_name::text as \"actorName\"");
 });
});
