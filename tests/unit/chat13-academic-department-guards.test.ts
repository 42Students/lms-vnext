import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin department guard contracts",()=>{
 it("SA-academics-people-07 validates names and displays friendly duplicate-department messages",()=>{
  const f=source("src/components/admin/department-create-form.tsx");
  expect(f).toContain("Please enter department name");
  expect(f).toContain("Department name must be 255 characters or less");
  expect(f).toContain('data["error"]==="DEPARTMENT_NAME_CONFLICT"');
  expect(f).toContain("DEPARTMENT_COPY.createFailed");
  expect(f).toContain('data["code"]==="DEPARTMENT_NAME_CONFLICT"');
  expect(f).toContain('catch{fail("Failed to create department");}');
 });
 it("SA-academics-people-08 disables archive when dependencies are recorded or unknown",()=>{
  const a=source("src/components/admin/department-actions.tsx");
  const d=source("src/components/admin/department-directory.tsx");
  expect(d).toContain("usage={row.usage}");
  expect(a).toContain("usage===null||usage===undefined");
  expect(a).toContain("disabled={pending||hasDependencies}");
  expect(a).toContain("Dependency counts unavailable — refresh to retry.");
 });
 it("SA-academics-people-09 guards unsaved department renames with a discard dialog",()=>{
  const a=source("src/components/admin/department-actions.tsx");
  expect(a).toContain("nextName.trim() !== name");
  expect(a).toContain("Discard department changes?");
  expect(a).toContain("requestEditClose()");
 });
 it("SA-academics-people-34 retains an actionable retry alert when an archive fails",()=>{
  const a=source("src/components/admin/department-actions.tsx");
  expect(a).toContain("Department was not archived.");
  expect(a).toContain('<Alert tone="error" title="Department was not archived"');
  expect(a).toContain("Retry archive");
  expect(a).toContain("onClick={archive}");
 });
});
