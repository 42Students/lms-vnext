import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("Recruiter job filter not in TPO directory",()=>{
 it("applies company identity only to recruiter list function",()=>{
   const source=readFileSync(resolve(process.cwd(),"src/modules/placements/recruiter-service.ts"),"utf8");
   const marker="export async function listOwnRecruiterPlacementJobs";
   const [tpo,own]=source.split(marker);
   expect(own).toBeDefined();
   expect(tpo).not.toContain("context.recruiter!.companyId");
   expect(own).toContain("eq(placementCompanies.id, context.recruiter!.companyId)");
 });
});
