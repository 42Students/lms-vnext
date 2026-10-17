import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin create and edit drive safety",()=>{
 it("SA-placements-projects-15 warns before unload after unsaved form changes and clears after save",()=>{
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(guard).toContain('window.addEventListener("beforeunload"');
  expect(guard).toContain('window.removeEventListener("beforeunload"');
  for(const path of ["placement-job-create-form.tsx","placement-draft-edit-form.tsx"]){
   const code=source("src/components/placements/"+path);
   expect(code).toMatch(/onChange=\{(?:markDirty|event\s*=>\s*\{[\s\S]*?markDirty\(\))/);
   expect(code).toContain("clearDirty();");
   expect(code).toContain("You have unsaved changes.");
  }
 });
 it("SA-placements-projects-16 renders a concrete season recovery link and keeps creation disabled without an active season",()=>{
  const code=source("src/components/placements/placement-job-create-form.tsx");
  expect(code).toContain('basePath+"/seasons"');
  expect(code).toContain("No active placement season.");
  expect(code).toContain("disabled={pending || !activeSeason}");
 });
});
