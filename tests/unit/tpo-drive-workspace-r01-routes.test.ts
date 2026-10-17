import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

/** Source-boundary regression: no special env gate may disable registered DB09 APIs. */
function source(path:string){return readFileSync(path,"utf8");}
describe("TPO drive applications API access",()=>{
 it("TPO-drive-workspace-R01 routes rely on tenant scope and origin checks, not DB09 env toggles",()=>{
  const preview=source("src/app/api/placements/tpo/bulk-actions/preview/route.ts");
  const confirm=source("src/app/api/placements/tpo/bulk-actions/confirm/route.ts");
  const csv=source("src/app/api/placements/tpo/jobs/[jobId]/applications/export/route.ts");
  for(const route of [preview,confirm,csv])expect(route).not.toMatch(/process\.env\.DB09_TPO_API_READY|DB09_VERIFIED/);
  expect(preview).toContain("requireTpoJobCollege(context)");
  expect(confirm).toContain("requireTpoJobCollege(context)");
  expect(preview).toContain("isSameOriginRequest(request)");
  expect(confirm).toContain("isSameOriginRequest(request)");
  expect(csv).toContain("getTpoDriveApplicationsExport(await getCurrentRequestContext()");
 });
});
