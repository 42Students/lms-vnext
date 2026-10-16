import {describe,it,expect} from "vitest";
import {suggestTpoBulkAction} from "@/modules/placements/tpo-bulk-action-suggestion-model";
describe("TPO-students-03 / TPO-drive-workspace-25 Actions window",()=>{
 it("selects a real ready action, never suggests changing skipped-only rows",()=>{
  expect(suggestTpoBulkAction([
   {action:"ELIGIBLE",label:"Mark eligible",ready:0,skipped:2,reasonSamples:[]},
   {action:"CLEAR_OVERRIDE",label:"Clear direct override",ready:1,skipped:1,reasonSamples:[]},
  ])?.action).toBe("CLEAR_OVERRIDE");
  expect(suggestTpoBulkAction([{action:"REJECTED",label:"Reject",ready:0,skipped:10,reasonSamples:[]}])).toBeNull();
 });
 it("never acts when no safe preview exists",()=>expect(suggestTpoBulkAction([])).toBeNull());
});
