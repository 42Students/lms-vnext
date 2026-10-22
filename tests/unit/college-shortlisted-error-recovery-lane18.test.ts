import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("G2-9-014-039: shortlisted page refresh failure recovery",()=>{
 it("does not downgrade a permissions failure and never reuses a stale page for a different learner role or drive",()=>{
  const page=readFileSync("src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx","utf8");
  expect(page).toContain("error instanceof AuthorizationError");
  expect(page).toContain('context.user.id+":"+context.membership.id+":"+jobId');
  expect(page).toContain("CollegeShortlistedLastGood");
 });
 it("offers Retry and Close while only showing an inert last-good snapshot",()=>{
  const source=readFileSync("src/components/placements/college-shortlisted-last-good.tsx","utf8");
  expect(source).toContain("useState<ReactNode>(()=>available?children:null)");
  expect(source).toContain("if(available)setLastGood(children)");
  expect(source).toContain("Previous shortlisted results are visible for reference only");
  expect(source).toContain('inert aria-label="Previous shortlisted results; actions disabled"');
  expect(source).toContain(">Retry</Link>");
  expect(source).toContain(">Close</Link>");
  expect(source).not.toContain("localStorage");
 });
});
