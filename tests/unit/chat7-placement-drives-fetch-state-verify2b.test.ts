import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

describe("Learner scoped placement load failures",()=>{
 it("distinguishes a failed discovery read from a real empty catalogue",()=>{
  const s=readFileSync("src/app/(authenticated)/learn/my-placements/jobs/page.tsx","utf8");
  expect(s).toContain("Placement drives unavailable");
  expect(s).toContain("This is not an empty jobs list.");
  expect(s).toContain("Retry loading drives");
  expect(s).toContain("error instanceof AuthorizationError");
  expect(s).toContain("error instanceof PlacementsServiceError");
  expect(s).toContain('!savedRead.available');
  expect(s).toContain("Retry saved jobs");
 });
});
