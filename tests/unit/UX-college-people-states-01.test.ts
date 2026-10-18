import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/people";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("/college/people loading and recovery",()=>{
 it("UX-college-people-loading-01 reserves an accessible directory shape",()=>{
  expect(file("loading.tsx")).toContain('shape="directory"');
 });
 it("UX-college-people-loading-02 uses the shared bounded loader",()=>{
  expect(file("loading.tsx")).toContain("GracefulPageLoading");
  expect(file("loading.tsx")).toContain("Loading college people…");
 });
 it("UX-college-people-error-01 shows a shared ErrorState",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
 });
 it("UX-college-people-error-02 offers a shared retry Button",()=>{
  expect(file("error.tsx")).toContain("<Button");
 });
});
