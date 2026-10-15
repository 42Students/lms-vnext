import {describe,it,expect} from "vitest";
import {learnerCoursePathPreview} from "@/modules/courses/learner-course-path-preview-model";
const rows=[
 {id:"b",name:"Two",sequence:2,items:[{progress:{status:"COMPLETED"}}]},
 {id:"a",name:"One",sequence:1,items:[]},
];
describe("learner published Learning Path preview",()=>{
 it("keeps authored order and distinguishes unmeasured from 100% progress",()=>{
  const result=learnerCoursePathPreview(rows,1);
  expect(result.lessons.map(x=>x.id)).toEqual(["a"]);
  expect(result.lessons[0]?.progress).toBeNull();
  expect(result.remaining).toBe(1);
 });
 it("does not accidentally disclose all lessons for negative or invalid limits",()=>{
  expect(learnerCoursePathPreview(rows,-1).lessons).toEqual([]);
  expect(learnerCoursePathPreview(rows,Number.NaN).lessons).toHaveLength(2);
  expect(learnerCoursePathPreview(rows,0).remaining).toBe(2);
 });
});
