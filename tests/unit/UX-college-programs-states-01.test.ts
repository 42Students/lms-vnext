import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/programs";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("UX /college/programs loading, error and retry",()=>{
 it("UX-college-programs-loading-01 reserves shared directory rows",()=>{
  expect(file("loading.tsx")).toContain('shape="directory"');
  expect(file("loading.tsx")).toContain("GracefulPageLoading");
 });
 it("UX-college-programs-loading-02 announces the exact route loading label",()=>{
  expect(file("loading.tsx")).toContain('label="Loading program form"');
  expect(file("loading.tsx")).toContain('label="Loading program rows"');
 });
 it("UX-college-programs-error-01 preserves a shared error state",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
 });
 it("UX-college-programs-error-02 offers a shared retry control",()=>{
  expect(file("error.tsx")).toContain('<Button type="button" variant="secondary" onClick={reset}>Retry</Button>');
 });
});
