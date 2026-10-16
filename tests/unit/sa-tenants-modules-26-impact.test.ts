import {it,expect} from "vitest";
import {moduleDisableImpactSummary} from "@/modules/module-access/admin-module-impact-service";
it("SA-tenants-modules-26 preview carries live-impact counts without pretending to certify safety",()=>{
 expect(moduleDisableImpactSummary("projects",[3])).toContain("3 active primary-mentor assignments");
 expect(moduleDisableImpactSummary("projects",[0])).toContain("not a safety check");
 expect(moduleDisableImpactSummary("placements",[2,9,4])).toContain("2 active drives, 9 in-progress applications and 4 pending offers");
});
