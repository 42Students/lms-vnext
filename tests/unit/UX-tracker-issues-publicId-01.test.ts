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
  // Evidence and history now render in their scoped components, not inline.
  expect(code).toContain("<TrackerScreenshotGallery");
  expect(code).toContain("<TrackerIssueLogsPanel");
  const screenshots=source("src/components/tracker/tracker-screenshot-gallery.tsx");
  const logs=source("src/components/tracker/tracker-issue-logs-panel.tsx");
  expect(screenshots).toContain('referrerPolicy="no-referrer"');
  expect(screenshots).toContain("/screenshots/");
  expect(logs).toContain("No warnings or errors were logged around that time.");
  expect(code).toContain("min-h-11");
  expect(code).not.toContain('target="_blank"');

 });
});
