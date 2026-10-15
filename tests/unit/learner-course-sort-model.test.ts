import {describe,expect,it} from "vitest";
import {sortLearnerCourseCards} from "@/modules/courses/learner-course-sort-model";
const card=(id:string,name:string,type:string,percent:number|null,dueAt:string|null)=>({
 course:{deliveryId:id,courseName:name,offeringType:type},
 summary:{overallPercent:percent},nextDue:dueAt?{dueAt}:null,
 lastActivity:null as string|null
});
const rows=[card("a","Zoology","REGULAR",90,null),card("b","Algebra","REGULAR",10,"2026-10-15T10:00:00Z"),card("c","Biology","ELECTIVE",0,"2026-10-14T10:00:00Z")];
describe("learner Course card sorts",()=>{
 it("preserves regular/elective groups even when an elective is due first",()=>{
  expect(sortLearnerCourseCards(rows,"DUE").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
 });
 it("sorts genuine recent activity without treating missing timestamps as today",()=>{
  const recent=[{...card("old","Old","REGULAR",30,null),lastActivity:"2026-10-01T00:00:00Z"},{...card("unknown","Unknown","REGULAR",70,null),lastActivity:null},{...card("new","New","REGULAR",50,null),lastActivity:"2026-10-15T00:00:00Z"}];
  expect(sortLearnerCourseCards(recent,"RECENT").map(x=>x.course.deliveryId)).toEqual(["new","old","unknown"]);
 });
 it("sorts progress without treating missing measurements as zero",()=>{
  expect(sortLearnerCourseCards(rows,"PROGRESS").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
  expect(sortLearnerCourseCards(rows,"NAME").map(x=>x.course.deliveryId)).toEqual(["b","a","c"]);
  expect(rows[0]?.course.deliveryId).toBe("a");
 });
});

describe("urgent open Course assessment ordering",()=>{
 it("sorts an actionable overdue assignment before future deadlines",()=>{
  const overdue={...card("late","Late","REGULAR",20,null),readOnly:false,overdueAssignments:1};
  const future={...card("soon","Soon","REGULAR",20,"2026-10-20T10:00:00Z"),readOnly:false,overdueAssignments:0};
  expect(sortLearnerCourseCards([future,overdue],"DUE")[0].course.deliveryId).toBe("late");
 });
 it("never treats a historical course as actionable overdue work",()=>{
  const old={...card("past","Past","REGULAR",20,null),readOnly:true,overdueAssignments:2};
  const current={...card("current","Current","REGULAR",20,"2026-10-20T10:00:00Z"),readOnly:false,overdueAssignments:0};
  expect(sortLearnerCourseCards([old,current],"DUE")[0].course.deliveryId).toBe("current");
 });
});
