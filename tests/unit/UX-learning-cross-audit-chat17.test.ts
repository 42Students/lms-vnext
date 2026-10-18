import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const inventories = [
  ["teacher", "pages-teacher.md", 36],
  ["teach", "pages-teach.md", 2],
  ["learn", "pages-learn.md", 43],
  ["quiz", "pages-quiz.md", 1],
  ["dashboard", "pages-dashboard.md", 1],
  ["notifications", "pages-notifications.md", 1],
] as const;
const routeCases = inventories.flatMap(([area, inventory]) => {
  const text = read("docs/orchestrator/ui-ux/" + inventory);
  return [...text.matchAll(/^- \[[ x]\] `([^`]+)` \((src\/.*\/page\.tsx)\)$/gm)].map((match) => ({
    area, route: match[1]!, source: match[2]!,
  }));
});

describe("chat-17 learning cross-audit: inventory and all 84 authored route shells", () => {
  it("UX-learning-inventory-01 audits every assigned teacher, teach, learn, quiz, dashboard and notification route", () => {
    expect(routeCases).toHaveLength(84);
    for (const [area, , expected] of inventories) {
      expect(routeCases.filter(row => row.area === area)).toHaveLength(expected);
    }
    expect(new Set(routeCases.map(row => row.source)).size).toBe(84);
  });
  it.each(routeCases)("UX-$area-$route-01 never reintroduces native popups, new-window links or 40px interactive targets", ({ source }) => {
    const text = read(source);
    // This tests a concrete WebView anti-pattern across every actual page,
    // not simply whether the file exists or contains generic layout classes.
    expect(text).not.toMatch(/window\.(?:alert|confirm|prompt|open)\s*\(/);
    expect(text).not.toMatch(/target\s*=\s*["']_blank["']/);
    expect(text).not.toMatch(/<(?:a|button|input|select|textarea)\b[^>]*\bmin-h-10\b/s);
  });
});

describe("chat-17 confirmed BLOCKER/MAJOR learning cross-audit fixes", () => {
  const readComponent = (name: string) => read("src/components/" + name);

  it("UX-teacher-live-classes-02 preserves meeting label, HTTPS safety and no new-window host requirement (LX-01)", () => {
    const p = read("src/app/(authenticated)/teacher/live-classes/page.tsx");
    expect(p).toContain('getFacultyLiveClasses(');
    expect(p).toContain('<ThirdPartyLink href={s.joinUrl} label="Open secure meeting link" />');
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-learn-my-placements-schedule-02 keeps online round and test labels, including assistive text (LX-02)", () => {
    const p = read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
    expect(p).toContain('<ThirdPartyLink href={join} label="Join online round" />');
    expect(p).toContain('ariaLabel="Open test · Take online assessment"');
    expect(p).toContain("LearnerRoundConfirmAttendance");
    expect(p).toContain("LearnerScheduleReschedule");
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-learn-application-company-02 preserves own application authorization and safe employer link (LX-03)", () => {
    const p = read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx");
    expect(p).toContain("getOwnLearnerApplicationCompany(context, applicationId)");
    expect(p).toContain('<ThirdPartyLink href={company.websiteUrl} label="Visit employer website ↗" />');
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-learn-profile-02 retains saved coding-profile labels and own profile authorization (LX-04)", () => {
    const p = read("src/app/(authenticated)/learn/profile/page.tsx");
    expect(p).toContain("requireOwnLearnerProfileAccess(context)");
    expect(p).toContain('label={`${entry.label} ↗`}');
    expect(p).toContain("learnerSavedCodingProfiles(profile.profileDocument)");
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-teacher-course-workspace-02 keeps lesson actions and all controls at least 44px (LX-05)", () => {
    const p = readComponent("courses/faculty-course-workspace.tsx");
    expect(p).toContain("<ThirdPartyLink");
    expect(p).toContain('"Join Meeting"');
    expect(p).toContain("View lesson details →");
    expect(p).not.toContain("min-h-10");
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-learn-course-workspace-02 handles safe content and local files without popup dependencies (LX-06)", () => {
    const p = readComponent("courses/learner-course-workspace.tsx");
    expect(p).toContain("learnerSafeExternalContentHref");
    expect(p).toContain("ThirdPartyLink");
    expect(p).toContain("Saved link unavailable.");
    expect(p).not.toContain('target="_blank"');
    expect(p).not.toContain("min-h-9 items-center");
  });
  it("UX-notifications-list-02 exposes a 44px notification selection action (LX-07)", () => {
    const p = readComponent("activity/notification-list.tsx");
    expect(p).toContain("min-h-11 items-center text-left");
    expect(p).not.toContain('className="min-h-10 text-left');
  });
  it("UX-learn-courses-02 course list has a 44px Show more courses action (LX-08)", () => {
    const p = readComponent("courses/learner-course-list.tsx");
    expect(p).toContain("setVisibleLimit((value) => value + PAGE_SIZE)");
    expect(p).toMatch(/min-h-11 items-center rounded-md[^\n]*Show more courses|className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4/);
  });
  it("UX-quiz-attempt-02 quiz Back choices are reachable by keyboard and thumb (LX-09)", () => {
    const p = readComponent("courses/learner-quiz-attempt.tsx");
    expect(p).toContain("ConfirmDialog");
    expect(p).toContain("learnerQuizQuestionNavState");
    expect(p).toMatch(/min-h-11 items-center[^\n]*>Back<\/button>/);
    expect(p).toMatch(/min-h-11 items-center[^\n]*>← Back<\/button>/);
  });
  it("UX-learning-webview-fallback-01 makes validated destinations inspectable and focusable", () => {
    const p = readComponent("ui/third-party-link.tsx");
    expect(p).toContain('url.protocol === "https:"');
    expect(p).toContain("!url.username && !url.password");
    expect(p).toContain("aria-label={ariaLabel}");
    expect(p).toContain("Copy link");
    expect(p).toContain("Destination URL");
    expect(p).not.toContain('target="_blank"');
  });
});
