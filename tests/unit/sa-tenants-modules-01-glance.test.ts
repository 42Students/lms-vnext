import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("SA-tenants-modules-01 at a glance uses college-scoped persisted counts",()=>{
 const source=readFileSync(new URL("../../src/modules/colleges/admin-college-at-glance-service.ts",import.meta.url),"utf8");
 expect(source).toContain("requirePermission(ctx,\"college.read\"");
 expect(source).toContain("eq(collegeMemberships.collegeId,collegeId)");
 expect(source).toContain("eq(departments.collegeId,collegeId)");
 expect(source).toContain("eq(placementJobs.collegeId,collegeId)");
});
