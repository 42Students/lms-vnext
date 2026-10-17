import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("offers a safe recruiter round route when no interview rounds can host slots",()=>{
 const page=readFileSync("src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx","utf8");
 expect(page).toMatch(/rounds\.length===0\s*\?/);
 expect(page).toContain("No pending or scheduled interview round");
 expect(page).toContain('+"/rounds/editor"');
 const form=readFileSync("src/components/placements/recruiter-interview-slot-form.tsx","utf8");
 expect(form).toContain("disabled={!rounds.length||submitting}");
});
