import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Final sprint recruiter applicant review accessibility",()=>{
 it("REC-home-drives-R05 focused applicant review traps Tab and restores keyboard focus",()=>{
  const modal=readFileSync("src/components/placements/recruiter-focused-review-shortcuts.tsx","utf8");
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(modal).toContain('document.getElementById("recruiter-focused-review-dialog")');
  expect(modal).toContain('modal.querySelector<HTMLElement>("#hr-applicant-drawer-title")');
  expect(modal).toContain('if(e.key==="Escape")');
  expect(modal).toContain('if(e.key==="Tab")');
  expect(modal).toContain('if(e.shiftKey&&');
  expect(modal).toContain('document.activeElement===last');
  expect(modal).toContain('last.focus()');
  expect(modal).toContain('first.focus()');
  expect(modal).toContain("if(opener?.isConnected)opener.focus()");
  expect(modal).toContain('e.key.toLowerCase()==="n"');
  expect(modal).toContain('e.key.toLowerCase()==="p"');
  expect(page).toContain('role="dialog" aria-modal="true"');
  expect(page).toContain("<RecruiterFocusedReviewShortcuts");
  expect(page).toContain("focusedNavigation?.previous");
  expect(page).toContain("focusedNavigation?.next");
 });
});
