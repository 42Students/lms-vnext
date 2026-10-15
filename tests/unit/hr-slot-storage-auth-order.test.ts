import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("authorizes recruiter job and permission before querying registered interview slots",()=>{
 const src=readFileSync("src/modules/placements/hr-interview-slot-service.ts","utf8");
 const start=src.indexOf("export async function writeHrInterviewSlot");
 const verify=src.indexOf("await verifyRecruiterSlotJob",start);
 const permission=src.indexOf("placements.recruiter.slot.manage",start);
 const write=src.indexOf("tx.insert(hrInterviewSlots)",start);
 expect(verify).toBeGreaterThan(start);
 expect(permission).toBeGreaterThan(verify);
 expect(write).toBeGreaterThan(permission);
 expect(src).toContain('from "@/db/schema/placement-hr-interview-slots"');
 expect(src).not.toContain("placementTableExists");
 expect(src).not.toContain("INTERVIEW_SLOTS_NOT_REGISTERED");
});
