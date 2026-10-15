import {describe,expect,it} from "vitest";
import {facultyResultsEmptyState,facultyResultsQuerySchema} from "@/modules/courses/faculty-results-model";
describe("Faculty results honest empty states",()=>{
 const base=facultyResultsQuerySchema.parse({});
 it("does not recommend filters when no Section assignment exists",()=>{
  expect(facultyResultsEmptyState(base,0)).toMatchObject({title:"No current teaching Sections",clearFilters:false});
 });
 it("offers reset for filtered empty and explains unfiltered no data",()=>{
  expect(facultyResultsEmptyState(base,2)).toMatchObject({title:"No assessments recorded yet",clearFilters:false});
  expect(facultyResultsEmptyState({...base,kind:"QUIZ",due:"OVERDUE"},2)).toMatchObject({clearFilters:true});
 });
});
