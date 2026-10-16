import {describe,expect,it} from "vitest";
import {partitionLearnerCourseLoads,LEARNER_UNAVAILABLE_COURSE_COPY} from "@/modules/courses/learner-course-load-isolation-model";
describe("LEARNER-home-courses-R01 per-delivery failure isolation",()=>{
 const courses=[{deliveryId:"one"},{deliveryId:"two"},{deliveryId:"three"}];
 it("retains healthy courses when one workspace query fails",()=>{
  const result=partitionLearnerCourseLoads(courses,[
   {status:"fulfilled",value:"Course A"},
   {status:"rejected",reason:new Error("database private diagnostics")},
   {status:"fulfilled",value:"Course C"},
  ]);
  expect(result.loaded).toEqual(["Course A","Course C"]);
  expect(result.failed).toEqual([{deliveryId:"two"}]);
  expect(LEARNER_UNAVAILABLE_COURSE_COPY).toBe("Some course records have incomplete or duplicate information. Unavailable cards cannot be opened.");
  expect(JSON.stringify(result)).not.toContain("private diagnostics");
 });
 it("handles zero courses, and keeps all failures separately",()=>{
  expect(partitionLearnerCourseLoads([],[])).toEqual({loaded:[],failed:[]});
  const result=partitionLearnerCourseLoads(courses,[{status:"rejected",reason:"a"},{status:"rejected",reason:"b"},{status:"rejected",reason:"c"}]);
  expect(result.loaded).toEqual([]);
  expect(result.failed).toEqual(courses);
 });
 it("rejects mismatched source-to-result cardinality",()=>{
  expect(()=>partitionLearnerCourseLoads(courses,[])).toThrow("COURSE_RESULT_COUNT_MISMATCH");
 });
});
