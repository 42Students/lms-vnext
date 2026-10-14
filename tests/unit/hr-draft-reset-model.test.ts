import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {hrDraftContainsWork} from "@/modules/placements/hr-draft-reset-model";
describe("HR unsent draft reset protection",()=>{
 it("detects edits, including hiring rounds and source-job prefill",()=>{
  const base=emptyHrDriveDraft();
  expect(hrDraftContainsWork(base)).toBe(false);
  expect(hrDraftContainsWork({...base,title:"Engineer"})).toBe(true);
  expect(hrDraftContainsWork({...base,rounds:[{kind:"TEST",name:"Assessment"}]})).toBe(true);
  expect(hrDraftContainsWork({...base,minimumCgpa:"8.0"})).toBe(true);
  expect(base.title).toBe("");
 });
});
