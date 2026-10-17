import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {previewTpoEligibilitySheet,parseTpoEligibilitySheetCsv} from "@/modules/placements/tpo-eligibility-sheet-model";
const read=(path:string)=>readFileSync(path,"utf8");
describe("TPO-batches-R04 eligibility import safety",()=>{
 it("TPO-batches-R04 never silently commits unusable eligibility rows",()=>{
  const route=read("src/app/api/placements/tpo/batches/[batchId]/import-commit/route.ts");
  const ui=read("src/components/tpo/tpo-batch-eligibility-import.tsx");
  expect(route).toContain("if(preview.skipped>0)");
  expect(route).toContain("IMPORT_HAS_UNUSABLE_ROWS");
  expect(ui).toContain('unresolved>0');
  expect(ui).toContain("Skip row");
  expect(ui).toContain("row(s) need attention before you can confirm");
 });
 it("TPO-batches-R04 preserves missing-roll and ambiguous-roll review reasons",()=>{
  const rows=parseTpoEligibilitySheetCsv("Roll number,Decision,Reason\n,Eligible,\nR1,No,\nR1,Yes,");
  const roster=[{studentCode:"student-1",membershipId:"student-1",expectedVersion:"none",rollNumber:"R1"}];
  const preview=previewTpoEligibilitySheet(rows,roster);
  expect(preview.map(row=>row.reason)).toEqual(["Roll number is missing","Ineligible needs a reason","Roll number appears twice"]);
  const bad=parseTpoEligibilitySheetCsv("Roll no,Decision\nR1,Maybe");
  expect(bad[0]?.decision).toBe("INVALID");
  expect(previewTpoEligibilitySheet(bad,roster)[0]?.reason).toBe("Decision must be Eligible, Ineligible or Not decided");
 });
});
