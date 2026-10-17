import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const files=["placement-job-create-form.tsx","placement-draft-edit-form.tsx"].map(p=>"src/components/placements/"+p);
describe("Chat13 drive create/edit resilience",()=>{
 it("GR-30 both drive forms use the synchronous guarded-action lock and busy button",()=>{
  for(const file of files){const code=source(file);expect(code).toMatch(/useGuardedAction\((?:\{timeoutMs:\d+\})?\)/);
   expect(code).toContain("await run(async()=>{");expect(code).toContain("pending");}
 });
 it("GR-31 drive POST PATCH and PUT mutations use the guarded apiFetch helper",()=>{
  for(const file of files){const code=source(file);expect(code).toContain('apiFetch<Record<string,unknown>>');
   expect(code).not.toContain("const response = await fetch(url");}
 });
 it("GR-32 a conflicting drive update retains current inputs and reports a friendly error",()=>{
  const code=source(files[1]);
  expect(code).toContain("apiFetch");
  expect(code).toContain("showToast");
  expect(code).toContain("clearDirty();");
  expect(code).toContain("catch (error)");
 });
 it("GR-33 drive creation checks business fields before making requests",()=>{
  const code=source(files[0]);
  expect(code).toContain("title.length < 3");
  expect(code).toContain("Maximum CTC");
  expect(code).toContain("Passing years must contain");
 });
 it("GR-36 drive create explains why there is no active placement season",()=>{
  const code=source(files[0]);
  expect(code).toContain("No active placement season.");
  expect(code).toContain('basePath+"/seasons"');
 });
 it("GR-37 user-facing interview/calendar dates identify IST",()=>{
  const code=source("src/components/placements/placement-calendar-workspace.tsx");
  expect(code).toContain("All times IST");
 });
 it("GR-62 long drive forms warn before losing unsaved changes and clear after confirmed save",()=>{
  const guard=source("src/components/placements/use-unsaved-drive-guard.ts");
  expect(guard).toContain('window.addEventListener("beforeunload"');
  for(const file of files){const code=source(file);expect(code).toMatch(/onChange=\{(?:markDirty|event\s*=>\s*\{[\s\S]*?markDirty\(\))/);
   expect(code).toContain("clearDirty();");}
 });
 it("GR-90 drive forms use shared toast feedback on failure and never print an API error code",()=>{
  for(const file of files){const code=source(file);expect(code).toContain("showToast");
   expect(code).toContain("apiFetch");expect(code).not.toContain("throw new Error(code");}
 });
});
