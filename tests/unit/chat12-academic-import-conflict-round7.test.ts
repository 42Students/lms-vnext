import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("TPO Students academic import resilience",()=>{
 it("TPO-students-33 protects an academic import preview and preserves selections on a stale-version response",()=>{
  const source=read("src/components/tpo/tpo-academic-import-workspace.tsx");
  expect(source).toContain("Array.isArray(result.preview?.rows)");
  expect(source).toContain("cause instanceof FriendlyFetchError && cause.status===409");
  expect(source).toContain("Your academic import choices are kept below");
  expect(source).not.toContain("window.confirm(");
  expect(source).toContain("runGuarded(async()=>");
 });
});
