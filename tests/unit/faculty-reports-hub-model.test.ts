import {describe,expect,it} from "vitest";
import {attendanceReportCounts,facultyReportHubHref,facultyReportsHubQuerySchema,
  publishedReportBreakdown,parseFacultyReportsHubLocation} from "@/modules/courses/faculty-reports-hub-model";
const id="00000000-0000-4000-8000-000000000001";
describe("Faculty Reports hub model",()=>{
 it("separates published counts from draft rows",()=>{
  expect(publishedReportBreakdown([
   {kind:"ASSIGNMENT",status:"PUBLISHED"},{kind:"ASSIGNMENT",status:"DRAFT"},
   {kind:"QUIZ",status:"PUBLISHED"},{kind:"QUIZ",status:"CLOSED"},
   {kind:"QUIZ",status:"ARCHIVED"},
  ])).toEqual({assignments:2,quizzes:3,publishedAssignments:1,publishedQuizzes:2});
 });
 it("does not infer unmarked attendance or missing sessions",()=>{
  expect(attendanceReportCounts([])).toEqual({scheduled:0,marked:0});
  expect(attendanceReportCounts([{markedAt:null},{markedAt:new Date("2026-10-14T01:00:00Z")}]))
   .toEqual({scheduled:2,marked:1});
 });
 it("rejects duplicate and forged Section report URL keys without coercing arrays",()=>{
   expect(parseFacultyReportsHubLocation(id,{kind:"QUIZ",page:"2"}).success).toBe(true);
   for(const raw of [{kind:["QUIZ","ALL"]},{page:["1","2"]},{collegeId:id},
      {kind:"QUIZ",deliveryId:id},{page:"-1"},{page:"10000"}]){
     expect(parseFacultyReportsHubLocation(id,raw).success).toBe(false);
   }
 });
 it("rejects client college and invalid Section, formats bounded links",()=>{
  expect(facultyReportsHubQuerySchema.safeParse({deliveryId:id,collegeId:id}).success).toBe(false);
  expect(facultyReportsHubQuerySchema.safeParse({deliveryId:"invalid"}).success).toBe(false);
  expect(facultyReportsHubQuerySchema.safeParse({deliveryId:id,page:0}).success).toBe(false);
  expect(facultyReportHubHref({deliveryId:id,kind:"QUIZ",page:2}))
   .toBe("/teacher/courses/"+id+"/reports?kind=QUIZ&page=2");
 });
});
