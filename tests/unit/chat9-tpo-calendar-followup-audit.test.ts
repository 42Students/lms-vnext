import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const service=readFileSync(join(process.cwd(),"src/modules/placements/tpo-crm-service.ts"),"utf8");
describe("TPO follow-up auditable writes",()=>{
 it("TPO-calendar-reports-24 inserts a tenant scoped activity event atomically with each create and move",()=>{
  const add=service.slice(service.indexOf("export async function addTpoFollowup"),service.indexOf("export async function listDueTpoFollowups"));
  const move=service.slice(service.indexOf("export async function moveTpoFollowup"),service.indexOf("export async function finishTpoFollowup"));
  for(const part of [add,move]){
   expect(part).toContain("getDb().transaction");
   expect(part).toContain("tx.insert(activityEvents)");
   expect(part).toContain("organizationId:college.organizationId");
   expect(part).toContain("subjectType:\"placement_tpo_followup\"");
   expect(part).toContain("actorUserId:context.user.id");
  }
  expect(add).toContain("placements.tpo_followup.created");
  expect(move).toContain("placements.tpo_followup.moved");
  expect(move).toContain("isNull(placementTpoFollowups.doneAt)");
 });
});
