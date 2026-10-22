import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {collegeStageMoveFeedback} from "@/modules/placements/college-stage-action-model";

describe("Legacy college Assessment bulk notices",()=>{
 it("reports the exact number moved to Assessment and never hides partial skips",()=>{
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",1,0).title)
   .toBe("1 application moved to Assessment");
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",3,0).title)
   .toBe("3 applications moved to Assessment");
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",2,3).title)
   .toBe("2 applications moved to Assessment · 3 skipped");
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",0,2).title)
   .toBe("0 applications moved to Assessment · 2 skipped");
 });
 it("uses the Assessment-specific failure prefix but retains generic messaging elsewhere",()=>{
  expect(collegeStageMoveFeedback("MOVE","ASSESSMENT",0,0).failurePrefix)
   .toBe("Failed to move to Assessment. ");
  expect(collegeStageMoveFeedback("MOVE","INTERVIEW",2,0))
   .toEqual({title:"Application status updated",failurePrefix:""});
  expect(collegeStageMoveFeedback("CORRECT","ASSESSMENT",1,2).title)
   .toBe("1 updated, 2 skipped");
 });
 it("wires stage-aware text into the real bulk UI without losing partial result and conflict handling",()=>{
  const source=readFileSync("src/components/placements/college-application-pipeline-controls.tsx","utf8");
  expect(source).toContain("const feedback=collegeStageMoveFeedback(action,target,moved,skipped)");
  expect(source).toContain("title:feedback.title");
  expect(source).toContain("setError(collegeStageMoveFeedback(action,target,0,0).failurePrefix+message)");
  expect(source).toContain("scopeEpoch.current!==epoch");
  expect(source).toContain("setOutcome({moved,skipped,results:payload.results??[]})");
 });
});
