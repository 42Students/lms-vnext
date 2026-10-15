import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("public share service selects only preview-approved candidate identity fields",()=>{
 const s=readFileSync(join(process.cwd(),"src/modules/placements/company-share/public-service.ts"),"utf8");
 expect(s).toContain("projectRecruiterVisibleShortlist(records)");
 expect(s).toContain("applicationId:placementApplications.id");
 expect(s).toContain("displayName:users.displayName");
 expect(s).toContain("email:users.email");
 expect(s).not.toContain("phone:users.");
 expect(s).not.toContain("resumeUrl:");
});
