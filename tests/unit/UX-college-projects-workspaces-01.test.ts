import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";
const source=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/projects/workspaces/page.tsx"),"utf8");
describe("/college/projects/workspaces UX",()=>{
 it("UX-college-projects-workspaces-01 preserves the canonical workspace route",()=>{
  expect(source).toContain('redirect(legacyCollegeWorkspacesListHref(await searchParams))');
 });
 it("UX-college-projects-workspaces-02 forwards only bounded valid legacy filters",()=>{
  // The filter allowlists live in the helper and are exercised in legacy-college-redirect-helpers.test.ts.
  expect(source).toContain('legacyCollegeWorkspacesListHref');
  expect(readFileSync(join(process.cwd(),"src/modules/projects/legacy-college-workspaces-list-query.ts"),"utf8")).toContain('q.length <= 120');
 });
});
