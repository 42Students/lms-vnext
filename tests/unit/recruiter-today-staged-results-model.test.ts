import {describe,it,expect} from "vitest";
import {recruiterTodayStagedResultsWaiting} from "@/modules/placements/recruiter-today-staged-results-model";
describe("Recruiter Today staged results waiting on TPO",()=>{
 it("projects a non-actionable submission without inventing TPO approval",()=>{
  expect(recruiterTodayStagedResultsWaiting([
   {roundId:"round",roundName:"Technical",jobId:"job",jobTitle:"Software Engineer",count:2},
  ])).toEqual([{id:"submitted-results:round",
   title:"Results for Technical are with the placement cell",
   detail:"Software Engineer · 2 results waiting for the placement cell to apply"}]);
 });
 it("omits empty and invalid counts",()=>{
  expect(recruiterTodayStagedResultsWaiting([
   {roundId:"a",roundName:"A",jobId:"job",jobTitle:"Engineer",count:0},
   {roundId:"b",roundName:"B",jobId:"job",jobTitle:"Engineer",count:Number.NaN},
  ])).toEqual([]);
 });
});
