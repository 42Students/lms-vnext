import {describe,expect,it} from "vitest";
import {sortLearnerCourseCards} from "@/modules/courses/learner-course-sort-model";
const card=(id:string,name:string,type:string,percent:number|null,dueAt:string|null)=>({
 course:{deliveryId:id,courseName:name,offeringType:type},
 summary:{overallPercent:percent},nextDue:dueAt?{dueAt}:null,
});
const rows=[card("a","Zoology","REGULAR",90,null),card("b","Algebra","REGULAR",10,"2026-10-15T10:00:00Z"),card("c","Biology","ELECTIVE",0,"2026-10-14T10:00:00Z")];
describe("learner Course card sorts",()=>{
 it("preserves regular/elective groups even when an elective is due first",()=>{
  expect(sortLearnerCourseCards(rows,"DUE").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
 });
 it("sorts progress without treating missing measurements as zero",()=>{
  expect(sortLearnerCourseCards(rows,"PROGRESS").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
  expect(sortLearnerCourseCards(rows,"NAME").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
  expect(rows[0]?.course.deliveryId).toBe("a");
 });
});
