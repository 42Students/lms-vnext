import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/semester-courses";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("UX /college/semester-courses loading, error and retry",()=>{
 it("UX-college-semester-courses-loading-01 preserves a shared 3-row skeleton",()=>{
  expect(file("loading.tsx")).toContain('<Skeleton variant="row" count={3}');
 });
 it("UX-college-semester-courses-loading-02 announces a bounded wait without fabricated empty data",()=>{
  expect(file("loading.tsx")).toContain("Loading course mappings");
 });
 it("UX-college-semester-courses-error-01 keeps the original recovery description",()=>{
  expect(file("error.tsx")).toContain("The mapping source could not be loaded. No zero-value conclusion is assumed.");
 });
 it("UX-college-semester-courses-error-02 uses ErrorState and keyboard-accessible Button",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
  expect(file("error.tsx")).toContain('<Button type="button" variant="secondary" onClick={reset}>Retry</Button>');
 });
});
