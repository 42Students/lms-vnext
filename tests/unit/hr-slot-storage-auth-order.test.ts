import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("rejects unauthorized slot writes before testing staged table availability",()=>{
 const source=readFileSync("src/modules/placements/hr-interview-slot-service.ts","utf8");
 const start=source.indexOf("export async function writeHrInterviewSlot");
 const verified=source.indexOf("await verifyRecruiterSlotJob(",start);
 const permission=source.indexOf('placements.recruiter.slot.manage',start);
 const gate=source.indexOf('placementTableExists("placement_hr_interview_slots")',start);
 expect(verified).toBeGreaterThan(start);
 expect(permission).toBeGreaterThan(verified);
 expect(gate).toBeGreaterThan(permission);
});
