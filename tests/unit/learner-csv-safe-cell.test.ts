import {expect,it} from "vitest";
import {learnerSafeCsvCell} from "@/modules/placements/learner-csv-safe-cell-model";
it("neutralizes formulas hidden behind whitespace and Unicode format marks",()=>{
 expect(learnerSafeCsvCell(" \u200B=HYPERLINK(\"evil\")")).toContain("' =HYPERLINK");
 expect(learnerSafeCsvCell("\t@SUM(1)")).toContain("'");
 expect(learnerSafeCsvCell("=1+1")).toBe("\"'=1+1\"");
 expect(learnerSafeCsvCell("ordinary \"company\"")).toBe("\"ordinary \"\"company\"\"\"");
});
