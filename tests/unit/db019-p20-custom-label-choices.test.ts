import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 AFTER_COLLEGE_OUTCOMES,
 CHOICE_AFTER_COLLEGE_OUTCOMES,
 afterCollegeCustomLabelOutcomeSchema,
 afterCollegeManualSchema,
} from "@/modules/placements/tpo-after-college-model";

describe("DB19-P20 frozen legacy custom-label taxonomy",()=>{
 it("allows only the four explicit college-choice outcomes",()=>{
  expect(CHOICE_AFTER_COLLEGE_OUTCOMES).toEqual([
   "HIGHER_STUDIES","ENTREPRENEURSHIP","COMPETITIVE_EXAMS","NOT_INTERESTED",
  ]);
  for(const choice of CHOICE_AFTER_COLLEGE_OUTCOMES)
   expect(afterCollegeCustomLabelOutcomeSchema.parse(choice)).toBe(choice);
 });
 it("excludes derived, pending and placement states from college custom labels",()=>{
  for(const choice of AFTER_COLLEGE_OUTCOMES.filter(
    value=>!CHOICE_AFTER_COLLEGE_OUTCOMES.some(option=>option===value),
  )){
   expect(afterCollegeCustomLabelOutcomeSchema.safeParse(choice).success).toBe(false);
  }
  // Staff may still record an unlabelled manual state. The label-specific
  // schema must not accidentally narrow the after-college outcome editor.
  expect(afterCollegeManualSchema.safeParse("NOT_DECIDED").success).toBe(true);
 });
 it("the server schema, detail validation and UI all use the same four-choice contract",()=>{
  const source=readFileSync("src/modules/placements/tpo-outcome-label-settings-service.ts","utf8");
  const details=readFileSync("src/modules/placements/tpo-after-college-details-model.ts","utf8");
  const editor=readFileSync("src/components/tpo/tpo-outcome-labels-editor.tsx","utf8");
  expect(source).toContain("outcome:afterCollegeCustomLabelOutcomeSchema");
  expect(details).toContain("outcome:afterCollegeCustomLabelOutcomeSchema");
  expect(editor).toContain("CHOICE_AFTER_COLLEGE_OUTCOMES.map");
  expect(editor).not.toContain("MANUAL_AFTER_COLLEGE_OUTCOMES.map");
 });
});
