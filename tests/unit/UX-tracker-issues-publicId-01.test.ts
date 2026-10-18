import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-issues-publicId-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/(authenticated)/tracker/issues/[publicId]/page.tsx");
  expect(code).toContain("getBugTrackerIssueForAdmin");
  expect(code).toContain("trackerPublicIdSchema");
  expect(code).toContain("if (error instanceof TrackerAdminError");
  expect(code).toContain("<ThirdPartyLink href={issue.evidenceLink}");
  expect(code).toContain("Open linked evidence ↗");
  expect(code).toContain("<TrackerWorkflowPanel");
  expect(code).toContain("<TrackerIssueLogsPanel");
  expect(code).toContain("No screenshot metadata.");
  expect(code).toContain("No workflow history yet.");
  expect(code).toContain("min-h-11");
  expect(code).not.toContain('target="_blank"');

 });
});
