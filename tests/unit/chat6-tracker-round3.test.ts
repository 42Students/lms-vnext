import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Super Admin tracker parity",()=>{
 it("SA-placements-projects-108 issue details link safe evidence and can copy link and markdown",()=>{
  const page=read("src/app/(authenticated)/tracker/issues/[publicId]/page.tsx");
  const control=read("src/components/tracker/tracker-issue-copy-actions.tsx");
  expect(page).toContain("TrackerIssueCopyActions");
  expect(page).toContain("Open linked evidence ↗");
  expect(control).toContain("Copy link");
  expect(control).toContain("Copy as markdown");
  expect(control).toContain("navigator.clipboard.writeText");
 });
 it("SA-placements-projects-110 uses legacy retest wording and persisted outcome messages",()=>{
  const code=read("src/components/tracker/tracker-workflow-panel.tsx");
  for(const text of ["Ready for retest","Does it work now?","Works now","Still broken",
    "Retest passed — issue closed","Retest failed — issue reopened"])expect(code).toContain(text);
 });
 it("SA-placements-projects-111 commit hashes open correct GitHub repositories only when valid",()=>{
  const code=read("src/components/tracker/tracker-workflow-panel.tsx");
  expect(code).toContain("https://github.com/42Students/lms2-fe/commit/");
  expect(code).toContain("https://github.com/42Students/lms/commit/");
  expect(code).toContain('7,40}');
  expect(code).toContain("View on GitHub ↗");
 });
 it("GR-04 tracker workflow uses friendly apiFetch for both mutations",()=>{
  const code=read("src/components/tracker/tracker-workflow-panel.tsx");
  expect(code).toContain("apiFetch(");
  expect(code).not.toContain("payload?.error");
 });
});
