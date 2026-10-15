import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("shows historical outside-drive form without obsolete schema-registration status",()=>{
 const form=readFileSync("src/components/placements/recorded-outside-form.tsx","utf8");
 for(const page of ["hr/drives","tpo/placements"]){
  const path="src/app/(authenticated)/"+page+"/recorded-outside/page.tsx";
  const content=readFileSync(path,"utf8");
  expect(content).toContain("<RecordedOutsideForm");
  expect(content).not.toContain("registered={");
 }
 expect(form).not.toContain("not registered");
 expect(form).toContain('action="/api/placements/recorded-outside"');
});
