import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Cross-audit Tracker directory and actions",()=>{
 it("UX-tracker-audit-findings-02 fields, long-list pagination and filters keep mobile hit targets",()=>{
  const s=src("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  for(const x of ['<Input name="q"','<Input name="area"','<Select name="status"','<Select name="severity"','<Select name="kind"','<Button type="submit" variant="primary"'])expect(s).toContain(x);
  expect(s).toContain('min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline');
  expect(s).toContain('empty={<p role="status"');
 });
 it("UX-tracker-issues-02 issue detail link works on touch and keyboard without hover",()=>{
  const s=src("src/app/(authenticated)/tracker/issues/page.tsx");expect(s).toContain('inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2');
 });
 it("UX-tracker-audit-findings-publicId-02 similar-findings action is keyboard-visible",()=>{
  const s=src("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");expect(s).toContain('focus-visible:outline-[var(--lms-teal-deep)]">Looks similar');
 });
 for(const [name,file] of [["bulk","src/components/tracker/tracker-issue-bulk-actions.tsx"],["workflow","src/components/tracker/tracker-workflow-panel.tsx"],["logs","src/components/tracker/tracker-issue-logs-panel.tsx"]] as const){
  it("UX-tracker-shared-"+name+"-02 removes undersized actions and low-contrast link ink",()=>{
   const s=src(file);expect(s).not.toContain("min-h-10");expect(s).not.toContain("text-primary-text");
  });
 }
});
