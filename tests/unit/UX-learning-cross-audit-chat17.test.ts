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
    expect(p).toContain('<Button variant="ghost" type="button"');
    expect(p).toContain('aria-label={"Open notification: "');
    const button=readComponent("ui/button.tsx");
    expect(button).toContain("max-[767px]:min-h-11");
    expect(p).not.toContain('className="min-h-10 text-left');
  });
  it("UX-learn-courses-02 course list has a 44px Show more courses action (LX-08)", () => {
    const p = readComponent("courses/learner-course-list.tsx");
    expect(p).toContain("setVisibleLimit((value) => value + PAGE_SIZE)");
    expect(p).toContain('className="min-h-[var(--lms-control-height)] max-md:min-h-11"');
    expect(p).toContain("Show more courses (");
  });
  it("UX-quiz-attempt-02 quiz Back choices are reachable by keyboard and thumb (LX-09)", () => {
    const p = readComponent("courses/learner-quiz-attempt.tsx");
    expect(p).toContain("ConfirmDialog");
    expect(p).toContain("learnerQuizQuestionNavState");
    expect(p).toContain("Back to quizzes</Link>");
    expect(p).toContain("inline-flex min-h-11");
    expect(p).toContain('className="min-h-11 md:min-h-9">← Back</Button>');
    expect(p).toContain("learnerQuizQuestionNavState");
  });
  it("UX-learning-webview-fallback-01 makes validated destinations inspectable and focusable", () => {
    const p = readComponent("ui/third-party-link.tsx");
    expect(p).toContain('url.protocol === "https:"');
    expect(p).toContain("!url.username && !url.password");
    expect(p).toContain('aria-label={ariaLabel ? `${ariaLabel} (opens in a new tab)` : undefined}');
    expect(p).toContain('rel="noopener noreferrer"');
    expect(p).toContain("Copy link");
    expect(p).toContain("Copy the destination below to try another browser.");
    expect(p).toContain('target="_blank"');
    expect(p).toContain("showFallback");
    expect(p).toContain("focus-visible:outline-2");
  });
  it("UX-learn-profile-confirm-03 protects seven dirty/delete flows with shared confirmation (LX-10)", () => {
    const p = readComponent("profile/learner-profile-workspace.tsx");
    expect(p).not.toContain("window.confirm");
    expect(p).toContain("async function closeDetails()");
    expect(p).toContain("async function removeItem(");
    expect(p).toContain("askConfirm(");
    expect(p).toContain("Discard profile changes?");
    expect(p).toContain("Discard contact changes?");
    expect(p).toContain("Delete this award?");
    expect(p).toContain("<ConfirmDialog");
    expect(p).toContain('<ThirdPartyLink href={entry.url} label="View link" />');
  });
  it("UX-learn-course-discussion-03 preserves draft navigation and destructive action confirmation (LX-11)", () => {
    const p = readComponent("courses/learner-course-discussion.tsx");
    expect(p).not.toContain("window.confirm");
    expect(p).toContain("setLeaveHref(destination.pathname+destination.search+destination.hash)");
    expect(p).toContain('title="Discard your unsent discussion message?"');
    expect(p).toContain('title="Delete this message?"');
    expect((p.match(/<ConfirmDialog/g)??[]).length).toBe(2);
    expect(p).toContain("setDraft(\"\")");
    expect(p).not.toContain('role="dialog"');
    expect(p).toContain("min-h-11");
    expect(p).toContain("text-base font-semibold text-foreground");
  });
  it("UX-learn-live-class-03 disables expired meeting but uses WebView-safe join (LX-12)", () => {
    const p=readComponent("courses/learner-live-class-link.tsx");
    expect(p).toContain("if(ended)return");
    expect(p).toContain('<ThirdPartyLink href={href} label="Join Meeting"/>');
    expect(p).toContain("Copy meeting link");
    expect(p).not.toContain('target="_blank"');
    expect(p).not.toContain("min-h-10");
  });
  it("UX-learn-assessment-overview-03 retains shared submitted URL and minimum action sizes (LX-13)", () => {
    const p=readComponent("courses/learner-assessment-overview.tsx");
    expect(p).toContain("learnerAssessmentSubmittedLinkHref");
    expect(p).toContain("<ThirdPartyLink");
    expect(p).not.toContain('target="_blank"');
    expect(p).not.toContain("min-h-10");
    expect(p).not.toContain("sm:min-h-9");
  });
  it("UX-learn-offers-03 opens own offer letter in same tab without losing label (LX-14)", () => {
    const p=readComponent("placements/learner-placement-offers.tsx");
    expect(p).toContain("item.letterHref");
    expect(p).toContain("View offer letter");
    expect(p).not.toContain('target="_blank"');
  });
  it("UX-learn-attendance-03 gives mobile history input 44px and 16px type (LX-15)", () => {
    const p=readComponent("attendance/learner-attendance-workspace.tsx");
    expect(p).toContain('aria-label="Jump to month"');
    expect(p).toContain("max-md:min-h-11");
    const input=readComponent("ui/input.tsx");
    expect(input).toContain("max-[767px]:min-h-11");
    expect(input).toContain("text-[var(--lms-font-base)]");
  });
  it("UX-learn-schedule-03 guards reschedule actions with 44px targets (LX-16)", () => {
    const p=readComponent("placements/learner-schedule-reschedule.tsx");
    expect(p).toContain("Ask to reschedule");
    expect(p).toContain("min-h-11");
    expect(p).not.toContain("min-h-10");
  });
  it("UX-notifications-toolbar-03 preserves unread filtering and 44px tabs (LX-17)", () => {
    const p=readComponent("activity/notification-toolbar.tsx");
    expect(p).toContain('view === "all"');
    expect(p).toContain('view === "unread"');
    expect(p).not.toContain("min-h-10");
    expect(p).toContain("min-h-11");
  });

});
