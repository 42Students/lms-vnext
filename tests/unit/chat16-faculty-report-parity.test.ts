import {describe,expect,it} from "vitest";
import {
 assignmentScoreSummary,buildScoreDistribution,scoreSummary,
} from "@/modules/courses/faculty-assessment-report-service";

describe("legacy faculty report grading boundaries",()=>{
 it("rounds each learner before computing a quiz's average",()=>{
  expect(scoreSummary([
   {score:0.595,maxScore:1},
   {score:0.895,maxScore:1},
  ]).averagePercent).toBe(75);
 });
 it("rounds assignment percent before allocating legacy distribution bands",()=>{
  const result=assignmentScoreSummary([
   {pointsAwarded:59.5,gradingStatus:"GRADED"},
   {pointsAwarded:89.5,gradingStatus:"GRADED"},
  ],100);
  expect(result.averagePercent).toBe(75);
  expect(result.distribution.find(bucket=>bucket.label==="60-69%")?.count).toBe(1);
  expect(result.distribution.find(bucket=>bucket.label==="90-100%")?.count).toBe(1);
 });
 it("always returns the five legacy score bands",()=>{
  expect(buildScoreDistribution([0,59,60,79,80,89,90,100]).map(x=>x.count))
   .toEqual([2,1,1,1,3]);
 });
});
