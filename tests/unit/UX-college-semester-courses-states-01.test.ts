import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/semester-courses";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("UX /college/semester-courses loading, error and retry",()=>{
 it("UX-college-semester-courses-loading-01 reserves shared directory rows",()=>{
  expect(file("loading.tsx")).toContain('shape="directory"');
  expect(file("loading.tsx")).toContain("GracefulPageLoading");
 });
 it("UX-college-semester-courses-loading-02 announces the exact route loading label",()=>{
  expect(file("loading.tsx")).toContain("Loading course mappings");
 });
 it("UX-college-semester-courses-error-01 preserves a shared error state",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
 });
 it("UX-college-semester-courses-error-02 offers a shared retry control",()=>{
  expect(file("error.tsx")).toContain('<Button type="button" variant="secondary" onClick={reset}>Retry</Button>');
 });
});
