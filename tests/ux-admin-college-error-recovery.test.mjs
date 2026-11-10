import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Source-level guard for the 2026-11-08 admin/college UX error recovery pass.
// This is NOT a substitute for rendered desktop/mobile and role/tenant acceptance.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracker = JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8"));
const groupIds = [
  "UX-G015", "UX-G016", "UX-G017", "UX-G018", "UX-G019",
  "UX-G020", "UX-G021", "UX-G023", "UX-G024", "UX-G029",
];

for (const groupId of groupIds) {
  test(`${groupId}: every signed-in route error preserves recovery within the workspace`, () => {
    const group = tracker.uxReview.groups.find(entry => entry.id === groupId);
    assert.ok(group, `${groupId} must remain in the canonical UX tracker`);
    const routes = group.sourceFiles.filter(file => file.endsWith("/error.tsx"));
    const pages = group.sourceFiles.filter(file => file.endsWith("/page.tsx"));
    assert.ok(pages.length > 0, `${groupId} must register at least one real page`);
    assert.ok(routes.length >= pages.length,
      `${groupId} must register an error boundary for every scoped page`);
    // Atomic repartition reduced some groups from 15-18 files to just a few
    // page families. A fixed five-error minimum now rejects legitimate groups
    // without checking whether their actual routes are protected. Match every
    // registered page to both recovery and loading boundaries instead.
    for (const page of pages) {
      const errorPath = page.replace(/page\.tsx$/, "error.tsx");
      const loadingPath = page.replace(/page\.tsx$/, "loading.tsx");
      assert.ok(group.sourceFiles.includes(errorPath),
        `${groupId} has a page without a registered error boundary: ${page}`);
      assert.ok(group.sourceFiles.includes(loadingPath),
        `${groupId} has a page without a registered loading boundary: ${page}`);
    }

    for (const relativePath of routes) {
      assert.ok(relativePath.startsWith("src/app/(authenticated)/"),
        `Unexpected boundary scope: ${relativePath}`);
      const source = fs.readFileSync(path.join(root, relativePath), "utf8");
      assert.match(source, /reset/, `Retry must be available: ${relativePath}`);
      assert.doesNotMatch(source, /error\.(?:message|stack)|JSON\.stringify\(error\)/,
        `Do not reveal raw errors: ${relativePath}`);

      if (source.includes("<GracefulErrorBoundary")) {
        assert.match(source, /<GracefulErrorBoundary[^>]*\binsideShell\b/s,
          `Nested authenticated route must not render the public full-screen 500: ${relativePath}`);
      } else {
        assert.match(source, /<(?:ButtonLink|TextLink|PageBackLink)\b[^>]*href=/s,
          `A retry-only error traps users without safe navigation: ${relativePath}`);
      }
    }
  });
}

test("UX-G029: personal inbox outages do not masquerade as empty announcements", () => {
  const page = fs.readFileSync(
    path.join(root, "src/app/(authenticated)/college/announcements/page.tsx"), "utf8",
  );
  assert.match(page, /getCollegeNoticeInbox\(context,[\s\S]*?\.catch\(error\s*=>/);
  assert.match(page, /error instanceof AuthorizationError\) notFound\(\)/);
  assert.equal((page.match(/!ownInbox \? <Alert tone="warning" title="Personal notifications unavailable"/g) ?? []).length, 2);
  assert.match(page, /listAnnouncementsForAdmin\(context,/);
  assert.doesNotMatch(page, /ownInbox\s*\?\?\s*\{\s*items:\s*\[\]/,
    "An unavailable inbox must not be fabricated as a successful empty read");
});

test("UX-G029: forbidden attendance policy deep links resolve to a safe not-found state", () => {
  const settings = fs.readFileSync(
    path.join(root, "src/app/(authenticated)/college/attendance/settings/page.tsx"), "utf8",
  );
  assert.match(settings, /getCollegeAttendancePolicy\(context, collegeId\)/);
  assert.match(settings, /error instanceof AuthorizationError/);
  assert.match(settings, /error instanceof CoursesServiceError && error.code === "LEARNING_ACCESS_DENIED"/);
  assert.match(settings, /notFound\(\)/);
  assert.match(settings, /throw error;/, "Non-authorization failures must remain visible as genuine failures");
});
