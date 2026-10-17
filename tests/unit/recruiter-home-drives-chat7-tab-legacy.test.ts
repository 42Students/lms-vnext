import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../../src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx",import.meta.url),"utf8");
describe("Recruiter Home Drives legacy recruiter tabs",()=>{
 it("REC-home-drives-55 orders overview, applicant, round, offer, request and discussion tabs",()=>{
  expect(src).toContain('["overview", "applicants", "rounds", "offers"]');
  expect(src).toContain('Applicants ("+applicants.counts.all+")');
  expect(src).toContain('Rounds & interviews');
  expect(src).toContain('Offers ("+offersTotal+")');
  const start=src.indexOf('tab=requests"+returnQuery');
  const discussion=src.indexOf('tab=discussion"+returnQuery');
  expect(start).toBeGreaterThan(0);
  expect(discussion).toBeGreaterThan(start);
 });
 it("REC-home-drives-20 preserves the originating Drives filters on workspace tabs",()=>{
  expect(src).toContain("safeDriveReturnTo(query.returnTo)");
  expect(src).toContain("returnQuery");
  expect(src).toContain("← Back to Drives");
 });
});