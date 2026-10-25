import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Final sprint recruiter Today partial and fatal errors",()=>{
 it("REC-home-drives-08 partial failure preserves usable cards with a retry action",()=>{
  const page=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  const error=readFileSync("src/app/(authenticated)/hr/home/error.tsx","utf8");
  expect(page).toContain("Promise.allSettled([");
  expect(page).toContain('calendarResult.status==="rejected"');
  expect(page).toContain('inboxResult.status==="rejected"');
  expect(page).toContain('conversationResult.status==="rejected"');
  expect(page).toContain("Some recruiter signals are unavailable:");
  expect(page).toContain("Missing information does not mean there is no work.");
  expect(page).toContain("(summaryPartiallyUnavailable||otherSignalsUnavailable)");
  expect(page).toContain("unavailableSources");
  expect(page).toContain('href={"/hr/home?collegeId="+encodeURIComponent(selectedId)}');
  expect(page).toContain(">Retry</Link>");
  expect(error).toContain("onClick={reset}");
  expect(error).toContain("Retry");
  expect(page).toContain("recentJobCapReached");
 });
});
