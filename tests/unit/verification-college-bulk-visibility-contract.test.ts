import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
describe("college bulk selection visibility",()=>{
 it("does not permit bulk selection of rows hidden by the shared workspace local-search input",()=>{
  const panel=readFileSync(resolve(process.cwd(),"src/components/verification/CollegeVerificationPanel.tsx"),"utf8");
  const workspace=readFileSync(resolve(process.cwd(),"src/components/verification/VerificationWorkspace.tsx"),"utf8");
  expect(panel).toContain("onSelectionChange={choose} disableLocalSearch");
  expect(workspace).toContain("{!disableLocalSearch&&<label");
 });
});
