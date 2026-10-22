import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("legacy learner drive browse sections",()=>{
 it("LEARNER-placements-15 groups unavailable cards without hiding recorded applications",()=>{
  const s=readFileSync(new URL("../../src/components/placements/learner-jobs-browse.tsx",import.meta.url),"utf8");
  expect(s).toContain("!item.deadlinePassed&&!item.canApply");
  expect(s).toContain("const expiredRoleCards=savedOnly?[]:expiredAll");
  expect(s).toContain("const notOpenRoleCards=savedOnly?[]:notOpenAll");
  expect(s).toContain('aria-label="Not open to you"');
  expect(s).toContain('open={filters.availability==="not-open"}');
  expect(s).toContain("See reasons");
  expect(s).toContain("ordinaryRoleCards.length>0");
  expect(s).toContain("notOpenRoleCards.length>0");
 });
});
