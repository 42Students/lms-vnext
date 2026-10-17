import {readFileSync} from "node:fs";
import {join} from "node:path";
import {it,expect} from "vitest";
it("MEN-projects-meetings-75 protects final delivery and evaluation feedback on discard",()=>{
 const code=readFileSync(join(process.cwd(),"src/components/projects/project-final-delivery-controls.tsx"),"utf8");
 const review=code.slice(code.indexOf("export function FinalReviewControl"));
 expect(review.match(/useProjectEditorDiscardGuard\(/g)?.length).toBe(2);
 expect(review.match(/<ConfirmDialog open=\{guard.discardOpen\}/g)?.length).toBe(2);
 expect(review).toContain("setRows([emptyEvaluationRow()])");
 expect(review).toContain("guard.requestClose()");
 expect(review).not.toContain("onOpenChange={setOpen}");
});
