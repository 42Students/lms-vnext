import {describe,expect,it} from "vitest";
import {facultyAssessmentRowsForSection,facultyAssessmentSectionOptions} from "../../src/modules/courses/faculty-assessment-section-filter-model";
const rows=[
 {deliveryId:"class-a",courseCode:"CS101",sectionName:"Section A",title:"Quiz A"},
 {deliveryId:"class-b",courseCode:"CS101",sectionName:"Section B",title:"Quiz B"},
 {deliveryId:"class-c",courseCode:"MATH10",sectionName:"Section A",title:"Assignment"},
];
describe("Faculty unified assessments Section filter",()=>{
 it("keeps course-code collisions as distinct authorized Section options",()=>{
  expect(facultyAssessmentSectionOptions(rows)).toEqual([
   {deliveryId:"class-a",label:"CS101 · Section A"},
   {deliveryId:"class-b",label:"CS101 · Section B"},
   {deliveryId:"class-c",label:"MATH10 · Section A"},
  ]);
 });
 it("limits rows by exact delivery, never course code",()=>{
  expect(facultyAssessmentRowsForSection(rows,"class-a").map(row=>row.title)).toEqual(["Quiz A"]);
  expect(facultyAssessmentRowsForSection(rows,"class-b").map(row=>row.title)).toEqual(["Quiz B"]);
  expect(facultyAssessmentRowsForSection(rows,"all")).toEqual(rows);
  expect(facultyAssessmentRowsForSection(rows,"unknown")).toEqual([]);
 });
});
