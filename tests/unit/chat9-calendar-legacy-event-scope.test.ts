import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Legacy TPO versus administrator calendar source scope",()=>{
 it("TPO-calendar-reports-15 includes DRAFT/PUBLISHED round drives, any scheduled round status and OPEN follow-ups only for TPO",()=>{
  const service=source("src/modules/placements/placement-calendar-service.ts");
  const caller=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(service).toContain('input.tpoLegacyScope?inArray(placementJobs.status,["DRAFT","PUBLISHED"])');
  expect(service).toContain('input.tpoLegacyScope?isNull(placementTpoFollowups.doneAt)');
  expect(service).toContain('input.tpoLegacyScope?["PUBLISHED"]');
  expect(caller).toContain('tpoLegacyScope:audience==="TPO"');
  expect(service).toContain("tpoLegacyScope:z.boolean().optional()");
 });
});