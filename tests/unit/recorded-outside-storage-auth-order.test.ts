import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("checks persisted scope before disclosing outside-drive storage readiness",()=>{
 const source=readFileSync("src/modules/placements/recorded-outside-service.ts","utf8");
 const start=source.indexOf("export async function recordOutsideDrive");
 const actor=source.indexOf("await outsideActor(",start);
 const permission=source.indexOf('placements.recruiter.outside.record',start);
 const persisted=source.indexOf("if(!current)throw",start);
 const gate=source.indexOf('placementTableExists("placement_outside_drive_records")',start);
 expect(start).toBeGreaterThan(-1);
 expect(actor).toBeGreaterThan(start);
 expect(permission).toBeGreaterThan(actor);
 expect(persisted).toBeGreaterThan(permission);
 expect(gate).toBeGreaterThan(persisted);
});
