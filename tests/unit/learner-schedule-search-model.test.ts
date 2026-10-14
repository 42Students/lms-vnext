import {describe,expect,it} from "vitest";
import {filterLearnerScheduleBySearch} from "@/modules/academics/learner-schedule-search-model";
const rows=[
 {title:"Workshop",courseName:null,courseCode:null,facultyName:"Mentor",location:"Lab 1",sectionName:"A"},
 {title:"Recitation",courseName:"Mathematics",courseCode:"MA201",facultyName:"Teacher",location:null,sectionName:"B"},
];
describe("learner schedule search",()=>{
 it("searches title, class context and section-wide events without dropping authorized rows",()=>{
  expect(filterLearnerScheduleBySearch(rows,"lab 1")).toEqual([rows[0]]);
  expect(filterLearnerScheduleBySearch(rows,"MA201")).toEqual([rows[1]]);
  expect(filterLearnerScheduleBySearch(rows,"NOT HERE")).toEqual([]);
 });
 it("empty or invalid overly long search preserves only supplied scoped sessions",()=>{
  expect(filterLearnerScheduleBySearch(rows," ")).toEqual(rows);
  expect(filterLearnerScheduleBySearch(rows,"a".repeat(101))).toEqual(rows);
 });
});
