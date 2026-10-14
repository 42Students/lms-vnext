import {describe,expect,it} from "vitest";
import {duplicateHrDraftRound} from "@/modules/placements/hr-draft-round-duplicate-model";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
describe("HR draft round duplication",()=>{
 it("adds an editable distinct named round without mutating source",()=>{
  const draft={...emptyHrDriveDraft(),title:"Engineer",
   description:"Role details adequate for preview validation.",location:"Hyderabad"};
  const one=duplicateHrDraftRound(draft,0);
  expect(one.rounds.map(r=>r.name)).toEqual(["Interview","Interview (copy)"]);
  const two=duplicateHrDraftRound(one,0);
  expect(two.rounds.map(r=>r.name)).toEqual(["Interview","Interview (copy 2)","Interview (copy)"]);
  expect(draft.rounds).toHaveLength(1);
  expect(hrDriveDraftSchema.safeParse(two).success).toBe(true);
 });
 it("blocks exceeding maximum or invalid index",()=>{
  const draft={...emptyHrDriveDraft()};
  expect(duplicateHrDraftRound(draft,1)).toBe(draft);
  const max={...draft,rounds:Array.from({length:12},(_,i)=>({
   kind:"TEST" as const,name:"Round "+i}))};
  expect(duplicateHrDraftRound(max,0)).toBe(max);
 });
});
