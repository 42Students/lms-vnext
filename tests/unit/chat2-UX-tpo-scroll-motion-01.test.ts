import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const src = (path: string) => readFileSync(path, "utf8");
const tpo = (name: string) => src("src/components/tpo/" + name + ".tsx");

describe("UX-tpo-scroll-motion: invisible scrollbars must never hide available content", () => {
  it("UX-tpo-scroll-motion-01 spreadsheet retains sticky pinned columns, desktop cue and mobile row cards", () => {
    const source = tpo("tpo-spreadsheet-grid");
    expect(source).toContain('<ScrollCue axis="x" label="TPO spreadsheet columns"');
    expect(source).toContain('className="space-y-2 md:hidden"');
    expect(source).toContain('position:"sticky"');
    expect(source).toContain("aria-label={openPrimary.ariaLabel(row)}");
    expect(source).toContain("No matching records.");
  });
  it("UX-tpo-scroll-motion-02 built-in job types have mobile priorities, explicit empty state and guarded changes", () => {
    const source = tpo("tpo-builtin-job-types-editor");
    expect(source).toContain("<DataTable rows={rows}");
    expect(source).toContain("No built-in job types available.");
    expect(source).toContain('mobilePriority:"primary"');
    expect(source).toContain('mobilePriority:"action"');
    expect(source).toContain("useConfirmFlow");
    expect(source).toContain("await askConfirm(");
    expect(source).toContain("{dialog}");
    expect(source).not.toContain("window.confirm(");
    expect(source).toContain("activeCount<=1");
    expect(source).not.toMatch(/<table(?:\s|>)/);
  });
  it("UX-tpo-scroll-motion-03 bell notifications scroll in Drawer without a nested fixed-height list", () => {
    const source = tpo("tpo-bell-panel");
    expect(source).toContain("<Drawer");
    expect(source).toContain('title="Notifications"');
    expect(source).toContain('aria-label={"Notifications, "+unread+" new"}');
    expect(source).not.toContain("max-h-80 space-y-2 overflow-y-auto");
    expect(source).toContain("Mark all read");
  });
  it("UX-tpo-scroll-motion-04 company conversation retains ARIA log and labelled scroll fade", () => {
    const source = tpo("tpo-company-team-conversation");
    expect(source).toContain('<ScrollCue axis="y" label="Company Team message history"');
    expect(source).toContain('role="log" aria-live="polite"');
    expect(source).toContain("</ol></ScrollCue>");
    expect(source).toContain("<ConfirmDialog");
  });
  it("UX-tpo-scroll-motion-05 company drive history uses DataTable and authorized job links", () => {
    const source = tpo("tpo-company-memory-workspace");
    expect(source).toContain("<DataTable rows={visibleDrives}");
    expect(source).toContain("No matching drives.");
    expect(source).toContain("encodeURIComponent(drive.id)");
    expect(source).toContain('mobilePriority:"primary"');
    expect(source).not.toMatch(/<table(?:\s|>)/);
  });
  it("UX-tpo-scroll-motion-06 academic import preview keeps row-level opt-in and match checks", () => {
    const source = tpo("tpo-academic-import-workspace");
    expect(source).toContain("<DataTable rows={preview}");
    expect(source).toContain("No students were found in the import preview.");
    expect(source).toContain('row.match!=="WILL_UPDATE"');
    expect(source).toContain("setExcluded(current=>event.target.checked");
    expect(source).not.toMatch(/<table(?:\s|>)/);
  });
  it("UX-tpo-scroll-motion-07 nudge roster has a labelled keyboard-accessible vertical cue", () => {
    const source = tpo("tpo-student-nudge-panel");
    expect(source).toContain('<ScrollCue axis="y" label="Students available for message"');
    expect(source).toContain('viewportClassName="max-h-48 space-y-1"');
    expect(source).toContain("validSelected.length>=25");
  });
  it("UX-tpo-scroll-motion-08 bulk debar confirmation uses single modal scroll; outcomes remain accessible", () => {
    const source = tpo("tpo-students-bulk-debar");
    expect(source).toContain("<Dialog open={confirm}");
    expect(source).toContain('<ScrollCue axis="y" label="Bulk debarment results"');
    expect(source).not.toContain("max-h-44 list-disc overflow-y-auto");
    expect(source).toContain("status===\"failed\"");
  });
  it("UX-tpo-scroll-motion-09 bulk applicant selectors and review links expose truthful fades", () => {
    const source = tpo("tpo-bulk-action-panel");
    expect(source).toContain('<ScrollCue axis="y" label="Select applicants"');
    expect(source).toContain('<ScrollCue axis="y" label="Selected applicant review links"');
    expect(source).toContain("Select current-page rows");
    expect(source).toContain("Confirm share");
  });
  it("UX-tpo-scroll-motion-10 visibility decision modal delegates scroll to Dialog", () => {
    const source = tpo("tpo-students-drive-visibility");
    expect(source).toContain("<Dialog open={confirm}");
    expect(source).not.toContain("max-h-40 list-disc overflow-auto");
    expect(source).toContain("server rechecks each college and learner");
  });
  it("UX-tpo-scroll-motion-11 paginated eligibility rows do not double-scroll inside Drawer", () => {
    const source = tpo("tpo-batch-eligibility-import");
    expect(source).toContain("<Drawer open={importOpen}");
    expect(source).toContain("previewPage*8");
    expect(source).not.toContain("max-h-96 space-y-1 overflow-y-auto");
    expect(source).toContain("I reviewed the matched learners");
  });
  it("UX-tpo-scroll-motion primitive uses dynamic overflow detection and passive scroll updates", () => {
    const cue = src("src/components/ui/scroll-cue.tsx");
    expect(cue).toContain("scrollWidth - node.clientWidth");
    expect(cue).toContain("scrollHeight - node.clientHeight");
    expect(cue).toContain('node.addEventListener("scroll", update, { passive: true })');
    expect(cue).toContain("ResizeObserver");
    expect(cue).toContain('tabIndex={edges.scrollable ? 0 : -1}');
    expect(cue).toContain('data-scroll-fade="end"');
    expect(cue).toContain("overscroll-x-contain");
    expect(cue).toContain("overscroll-contain");
  });
});
