import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const base="src/app/(authenticated)/college/quizzes";
const file=(name:string)=>readFileSync(join(process.cwd(),base,name),"utf8");
describe("/college/quizzes loading and recovery",()=>{
 it("UX-college-quizzes-loading-01 reserves an accessible directory shape",()=>{
  expect(file("loading.tsx")).toContain('shape="directory"');
 });
 it("UX-college-quizzes-loading-02 uses the shared bounded loader",()=>{
  expect(file("loading.tsx")).toContain("GracefulPageLoading");
  expect(file("loading.tsx")).toContain("Loading college quizzes");
 });
 it("UX-college-quizzes-error-01 shows a shared ErrorState",()=>{
  expect(file("error.tsx")).toContain("ErrorState");
 });
 it("UX-college-quizzes-error-02 offers a shared retry Button",()=>{
  expect(file("error.tsx")).toContain("<Button");
 });
});
