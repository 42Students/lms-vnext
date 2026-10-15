import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
it("tracks registered HR interview and outside-drive tables rather than staged SQL",()=>{
 const journal=read("drizzle/meta/_journal.json");
 expect(journal).toContain("0078_placement_hr_interview_slots");
 expect(journal).toContain("0079_placement_outside_drive_records");
 const slots=read("src/db/schema/placement-hr-interview-slots.ts");
 const outside=read("src/db/schema/placement-outside-drives.ts");
 expect(slots).toContain('placement_hr_interview_slots');
 expect(outside).toContain('placement_outside_drive_records');
});
