import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/verification";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("/college/verification loading and recovery",()=>{
 it("UX-college-verification-loading-01 reserves an accessible directory shape",()=>{
  expect(file("loading.tsx")).toContain('shape="directory"');
 });
 it("UX-college-verification-loading-02 uses the shared bounded loader",()=>{
  expect(file("loading.tsx")).toContain("GracefulPageLoading");
  expect(file("loading.tsx")).toContain("Loading verification requests…");
 });
 it("UX-college-verification-error-01 shows a shared ErrorState",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
 });
 it("UX-college-verification-error-02 offers a shared retry Button",()=>{
  expect(file("error.tsx")).toContain("<Button");
 });
});
