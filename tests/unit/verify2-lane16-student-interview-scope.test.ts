import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("G2-15-002-018/055 per-application placement history",()=>{
 it("rejects malformed cross-job candidate slots before showing a future interview",()=>{
  const code=readFileSync("src/modules/placements/college-placement-student-lookup-service.ts","utf8");
  const from=code.indexOf("const interviews=ids.length?");
  const until=code.indexOf("const nextInterviewByApplication=",from);
  expect(from).toBeGreaterThan(0);
  expect(until).toBeGreaterThan(from);
  const query=code.slice(from,until);
  expect(query).toContain("eq(placementApplications.id,placementRoundCandidateSlots.applicationId)");
  expect(query).toContain("eq(placementApplications.jobId,placementJobRounds.jobId)");
  expect(query).toContain('eq(placementRoundCandidateSlots.status,"BOOKED")');
  expect(query).toContain("gte(placementRoundCandidateSlots.startsAt,now)");
 });
 it("displays authorized rejection detail after the application and upcoming interview metadata",()=>{
  const page=readFileSync("src/app/(authenticated)/admin/placements/student-lookup/page.tsx","utf8");
  expect(page).toContain("Rejection reason: {row.rejectionReason}");
  expect(page.indexOf("Rejection reason: {row.rejectionReason}"))
   .toBeGreaterThan(page.indexOf("Next interview: {row.nextInterview.roundName}"));
 });
});
