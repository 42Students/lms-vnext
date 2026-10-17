import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {courseApiError} from "@/components/courses/learner-course-api";
const file=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("Faculty Courses friendly errors and graceful form authoring",()=>{
 it("FAC-courses-23 GR-04 keeps server validation provider details out of faculty UI",async()=>{
  const response=new Response(JSON.stringify({error:"SOME_INTERNAL_CODE",issues:[{message:"SQLSTATE 42601"}]}),
   {status:400,headers:{"Content-Type":"application/json"}});
  const message=await courseApiError(response);
  expect(message).toBe("Please check the highlighted fields and try again.");
  expect(message).not.toContain("SQLSTATE");
 });
 it("FAC-courses-15 GR-01 preserves friendly known authoring error copy",async()=>{
  const response=new Response(JSON.stringify({error:"CONTENT_TYPE_SHAPE_INVALID"}),{status:422});
  expect(await courseApiError(response)).toBe("The content details do not match the selected content type.");
 });
 it("FAC-courses-24 GR-35 keeps an explicit discard confirmation in faculty authoring",()=>{
  const source=file("src/components/courses/faculty-lesson-authoring.tsx");
  expect(source).toContain("ConfirmDialog");
  expect(source).not.toContain("window.confirm");
  expect(source).toContain("setDiscardConfirm(true)");
 });
 it("FAC-courses-23 GR-04 uses bounded shared API requests and safe errors on content creation",()=>{
  const source=file("src/components/courses/faculty-lesson-authoring.tsx");
  expect(source).toContain("apiFetch<");
  expect(source).not.toContain("await fetch(endpoint");
 });
});
