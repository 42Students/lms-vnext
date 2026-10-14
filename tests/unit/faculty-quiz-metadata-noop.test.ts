import {describe,expect,it} from "vitest";
import {facultyQuizMetadataUnchanged} from "@/modules/courses/faculty-quiz-authoring-model";

const current={
 title:"Semester review",description:"Initial guidance",
 dueAt:new Date("2026-10-30T05:00:00.000Z"),maxAttempts:2,
};
describe("Faculty quiz metadata-only audit idempotence",()=>{
 it("recognizes unchanged fields despite different timezone representations",()=>{
  expect(facultyQuizMetadataUnchanged(current,{
   title:"Semester review",description:"Initial guidance",
   dueAt:"2026-10-30T10:30:00.000+05:30",maxAttempts:2,
  })).toBe(true);
 });
 it("allows real title, description, deadline and attempt-policy changes",()=>{
  const saved={title:current.title,description:current.description,
   dueAt:current.dueAt.toISOString(),maxAttempts:current.maxAttempts};
  expect(facultyQuizMetadataUnchanged(current,{...saved,title:"New title"})).toBe(false);
  expect(facultyQuizMetadataUnchanged(current,{...saved,description:"Changed"})).toBe(false);
  expect(facultyQuizMetadataUnchanged(current,{...saved,dueAt:null})).toBe(false);
  expect(facultyQuizMetadataUnchanged(current,{...saved,maxAttempts:3})).toBe(false);
 });
 it("does not conflate null and persisted metadata",()=>{
  expect(facultyQuizMetadataUnchanged({
   title:"X",description:null,dueAt:null,maxAttempts:1,
  },{title:"X",description:null,dueAt:null,maxAttempts:1})).toBe(true);
 });
});
