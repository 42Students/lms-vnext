import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("validates persisted grants before writing to the registered outside-drive table",()=>{
 const src=readFileSync("src/modules/placements/recorded-outside-service.ts","utf8");
 const start=src.indexOf("export async function recordOutsideDrive");
 const actor=src.indexOf("await outsideActor(",start);
 const grant=src.indexOf("if(!current)throw",start);
 const insert=src.indexOf("tx.insert(placementOutsideDriveRecords)",start);
 expect(actor).toBeGreaterThan(start);
 expect(grant).toBeGreaterThan(actor);
 expect(insert).toBeGreaterThan(grant);
 expect(src).toContain('from "@/db/schema/placement-outside-drives"');
 expect(src).not.toContain("placementTableExists");
});
