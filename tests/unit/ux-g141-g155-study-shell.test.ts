import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("UX-G141 study group action and import safeguards", () => {
  it("blocks duplicate group mutations across rapid clicks", () => {
    const group = source("src/components/groups/college-group-actions.tsx");
    expect(group).toContain("mutationInFlight.current = true");
    expect(group).toContain("mutationInFlight.current = false");
    expect(group).toContain("pending || mutationInFlight.current");
  });

  it("retains usable validation feedback in the action dialog", () => {
    const members = source("src/components/groups/college-study-member-actions.tsx");
    expect(members).toContain("function reviewAction(");
    expect(members).toContain('setError(null);');
    expect(members).toContain('reviewAction({ action: "ADD", membershipId });');
    expect(members).toContain("[0-9a-f]{12}");
    expect(members).toContain('{error ? <Alert tone="error">{error}</Alert> : null}');
  });

  it("does not permit a failed replacement upload to reuse a previous CSV", () => {
    const csv = source("src/components/groups/college-group-import-preview.tsx");
    expect(csv).toContain('setCsv("");');
    expect(csv).toContain("revision === csvRevision.current");
    expect(csv).toContain("setManualError(");
    expect(csv).toContain("groupCsvValidationLabel(row.status)");
  });
});

describe("G141/G155/G175 synthetic browser fixture security", () => {
  it("fixture is disabled outside an explicit development-mode opt-in", () => {
    const page = source("src/app/e2e/ux-g141-g155-study-shell/page.tsx");
    expect(page).toContain('process.env.NODE_ENV !== "development"');
    expect(page).toContain('process.env["UX_STUDY_SHELL_FIXTURE"] !== "1"');
    expect(page).toContain("notFound()");
    expect(page).not.toContain("setCookie");
  });
});

describe("UX-G155 shell notification and mobile navigation safeguards", () => {
  it("keeps the mobile menu opener focusable for dialog focus return", () => {
    const nav = source("src/components/shell/mobile-navigation.tsx");
    expect(nav).not.toContain("disabled={open}");
    expect(nav).toContain('aria-label="Open menu"');
    expect(nav).toContain('onNavigate={() => setOpen(false)}');
    expect(nav).toContain("closeForDesktop");
  });

  it("does not silently keep failed deadline refreshes as current", () => {
    const bell = source("src/components/shell/learner-notification-bell.tsx");
    expect(bell).toContain("setDue([])");
    expect(bell).toContain("setDueError(true)");
    expect(bell).toContain("Course deadlines could not be refreshed");
    expect(bell).toContain("latest 40 notifications");
    expect(bell).toContain('InlineNotice tone="error" message={error}');
  });

  it("keeps route announcements and focus changes aware of query-only navigation", () => {
    const announce = source("src/components/shell/route-announcer.tsx");
    expect(announce).toContain("const queryOnly=prior.path===pathname");
    expect(announce).toContain("if(!queryOnly && !document.querySelector");
    expect(announce).toContain('aria-live="polite"');
  });
});
