import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("uses registered outside-drive service, origin check and scoped receipt",()=>{
 const route=readFileSync("src/app/api/placements/recorded-outside/route.ts","utf8");
 expect(route).toContain("isSameOriginRequest(request)");
 expect(route).toContain("recordOutsideDrive(");
 expect(route).toContain("saved.id");
 expect(route).not.toContain("EXTERNAL_RECORD_STORAGE_PENDING");
});
