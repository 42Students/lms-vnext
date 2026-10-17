import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
const source=readFileSync(new URL("../../src/components/tpo/tpo-student-outcome-pill.tsx",import.meta.url),"utf8");
it("TPO-students-54 displays recorded on-campus and off-campus placement labels instead of flattening to Placed",()=>{
 expect(source).toContain('recorded==="PLACED_ON_CAMPUS"||recorded==="PLACED_OFF_CAMPUS"');
 expect(source).toContain('AFTER_COLLEGE_LABELS[recorded]:"Placed"');
 expect(source).toContain("title={placed?");
});
