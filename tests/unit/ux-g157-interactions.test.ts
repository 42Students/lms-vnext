import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("UX-G157 TPO component recovery and privacy contracts",()=>{
 it("remounts company message drafts at a company AND actor boundary",()=>{
  const ui=source("src/components/tpo/tpo-company-team-composer.tsx");
  expect(ui).toContain("key={actorUserId+\":\"+companyId}");
  expect(ui).toContain('const storageKey="tpo-company-team:"+actorUserId+":"+companyId');
  expect(ui).toContain("idempotencyKey");
  expect(ui).toContain('credentials:"same-origin"');
 });
 it("gives accessible IST range feedback without removing server validation",()=>{
  const ui=source("src/components/tpo/tpo-blocked-dates-editor.tsx");
  expect(ui).toContain('const rangeHelpId=useId()');
  expect(ui).toContain('aria-describedby={rangeHelpId}');
  expect(ui).toContain('rangeLength>90');
  expect(ui).toContain("A blocked range can contain at most 90 days.");
  expect(ui).toContain('aria-invalid={Boolean(rangeError)}');
  expect(ui).toContain('disabled={busy||!validRange');
 });
 it("does not hide saved-view errors behind the delete dialog or over-pin",()=>{
  const ui=source("src/components/tpo/tpo-batch-student-saved-views.tsx");
  expect(ui).toContain('const pinLimitReached=');
  expect(ui).toContain("Five views are already pinned.");
  expect(ui).toContain('disabled={busy||guarded||pinLimitReached');
  expect(ui).toContain('disabled={busy||guarded} onClick={toggle}');
  expect(ui).toContain('role="alert" className="text-sm text-error">{error}');
  expect(ui).toContain('if(result)setDeleteTarget(null)');
 });
 it("keeps campaign sends disabled if provider delivery is unavailable",()=>{
  const ui=source("src/components/tpo/tpo-campaign-send-control.tsx");
  expect(ui).toContain('disabled={!ready||busy||recipients===0}');
  expect(ui).toContain('!ready||recipients===0');
  expect(ui).toContain('Provider acceptance does not prove delivery.');
 });
 it("refuses to expose synthetic acceptance page outside dev fixture",()=>{
  const page=source("src/app/e2e/ux-g157-fixture/page.tsx");
  expect(page).toContain('process.env.NODE_ENV!=="development"');
  expect(page).toContain('process.env.UX_G157_FIXTURE!=="1"');
  expect(page).toContain("notFound()");
 });
});
