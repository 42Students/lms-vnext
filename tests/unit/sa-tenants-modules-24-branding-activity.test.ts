import {it,expect} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-24 puts the branding event in the same mutation transaction",()=>{
 const source=readFileSync(new URL("../../src/modules/colleges/branding-service.ts",import.meta.url),"utf8");
 expect(ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED).toBe("platform.college.branding_updated");
 expect(source).toContain("getDb().transaction(async tx=>");
 expect(source).toContain("recordActivityEventInTransaction(tx,context");
 expect(source).toContain("metadata:{version:row.version}");
 expect(source).not.toContain("metadata:{logoUrl:");
});
