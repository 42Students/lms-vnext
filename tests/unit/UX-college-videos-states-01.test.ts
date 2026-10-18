import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/videos";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("UX /college/videos loading, error and retry",()=>{
 it("UX-college-videos-loading-01 preserves a shared 3-row skeleton",()=>{
  expect(file("loading.tsx")).toContain('<Skeleton variant="row" count={3}');
 });
 it("UX-college-videos-loading-02 announces a bounded wait without fabricated empty data",()=>{
  expect(file("loading.tsx")).toContain("Loading videos");
 });
 it("UX-college-videos-error-01 keeps the original recovery description",()=>{
  expect(file("error.tsx")).toContain("Content metadata could not be loaded. No empty-result conclusion is assumed.");
 });
 it("UX-college-videos-error-02 uses ErrorState and keyboard-accessible Button",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
  expect(file("error.tsx")).toContain('<Button type="button" variant="secondary" onClick={reset}>Retry</Button>');
 });
});
