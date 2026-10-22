import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Cross-audit Tracker directory and actions",()=>{
 it("UX-tracker-audit-findings-02 fields, long-list pagination and filters keep mobile hit targets",()=>{
  const s=src("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  for(const x of ['<Input name="q"','<Select name="area" multiple','<Select name="status" multiple','<Select name="severity" multiple','<Select name="kind" multiple','<Button type="submit" variant="primary"'])expect(s).toContain(x);
  expect(s).toContain('aria-label="tracker audit findings filters"');
  expect(s).toContain('<Pagination label="Audit findings pages"');
  expect(s).toContain('className="inline-flex min-h-11 items-center font-semibold text-link md:min-h-9"');
  expect(s).toContain('<IndependentAuditFindingsBoard rows={data.items}');
 });
 it("UX-tracker-issues-02 issue detail link works on touch and keyboard without hover",()=>{
  const s=src("src/app/(authenticated)/tracker/issues/page.tsx");
  expect(s).toContain('href={"/tracker/issues/"+encodeURIComponent(issue.publicId)}');
  expect(s).toContain('focus-visible:outline-2 focus-visible:outline-offset-[3px]');
  expect(s).toContain('role="listitem"');
 });
 it("UX-tracker-audit-findings-publicId-02 similar-findings action is keyboard-visible",()=>{
  const s=src("src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx");
  expect(s).toContain('>Looks similar</Link>');
  expect(s).toContain('focus-visible:outline-2 focus-visible:outline-offset-[3px]');
  expect(s).toContain('focus-visible:outline-[var(--lms-primary-text)]');
 });
 for(const [name,file] of [["bulk","src/components/tracker/tracker-issue-bulk-actions.tsx"],["workflow","src/components/tracker/tracker-workflow-panel.tsx"],["logs","src/components/tracker/tracker-issue-logs-panel.tsx"]] as const){
  it("UX-tracker-shared-"+name+"-02 removes undersized actions and low-contrast link ink",()=>{
   const s=src(file);expect(s).not.toContain("min-h-10");
   expect(s).toContain("min-h-11");
   expect(s).toContain("focus-visible:");
  });
 }
});
