import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("G2-15-005-030: learner drive not-found versus error",()=>{
 it("keeps privacy-preserving missing-drive copy distinct from broken data sources",()=>{
  const page=readFileSync("src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain("Promise.allSettled([");
  expect(page).toContain("source.reason instanceof AuthorizationError");
  expect(page).toContain('title="We couldn\'t load this drive"');
  expect(page).toContain('title="This drive can\'t be shown"');
  expect(page).toContain("failedJourney");
  expect(page).toContain("Browse drives");
  expect(page).toContain("Retry loading drive");
  expect(page).toContain("My applications");
  expect(page).not.toContain('title="Job unavailable"');
 });
});
