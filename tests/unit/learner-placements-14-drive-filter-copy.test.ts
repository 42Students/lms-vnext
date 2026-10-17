import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("LEARNER-placements-14 drive filter copy",()=>{
 it("LEARNER-placements-14 uses the legacy search prompt, deadline sort and clear action",()=>{
  const source=readFileSync(new URL("../../src/components/placements/learner-jobs-browse.tsx",import.meta.url),"utf8");
  expect(source).toContain("Search by title, company, location…");
  expect(source).toContain("Deadline soonest");
  expect(source).toContain("Newest first");
  expect(source).toContain("Clear filters");
 });
});