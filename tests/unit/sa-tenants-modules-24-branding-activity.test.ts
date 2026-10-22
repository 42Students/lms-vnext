import {it,expect} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-24 puts the branding event in the same mutation transaction",()=>{
 const source=readFileSync(new URL("../../src/modules/colleges/branding-service.ts",import.meta.url),"utf8");
 expect(ACTIVITY_EVENT_TYPES.PLATFORM_COLLEGE_BRANDING_UPDATED).toBe("platform.college.branding_updated");
 expect(source).toContain("getDb().transaction(async tx=>");
 expect(source).toMatch(/recordActivityEventInTransaction\(tx,\s*context/);
 expect(source).toMatch(/metadata:\s*\{\s*version:\s*row\.version,changedAssetFields,storageCleanup/);
 expect(source).not.toContain("metadata:{logoUrl:");
});
