import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 8 navigation/context closure contracts", () => {
  test("the provider/layout tree stays mounted while route content changes", () => {
    const source = read("src/pages/_app.js");
    // BE-0205: resetKey is a prop (not a React key), so the asPath reset clears a crash without remounting the tree.
    expect(source).toContain("<AppErrorBoundary resetKey={router.asPath}>");
    expect(source).toContain("<Provider store={store}>");
    expect(source).not.toMatch(/<Provider[^>]+key=\{router\./);
    expect(source).toContain("useRouteScrollRestoration(router)");
  });

  test("admin Drives preserve list search/filter/page and carry return context into details", () => {
    const jobs = read("src/pages/superadmin/sections/Jobs.js");
    const landing = read("src/pages/superadmin/sections/DrivesLanding.js");
    const subnav = read("src/components/admin/placements/DriveSubNav.jsx");

    expect(jobs).toContain("updateListQuery");
    expect(jobs).toContain("withReturnTo(path, router.asPath)");
    expect(landing).toContain("updateSearchQuery");
    expect(landing).toContain("withReturnTo(target, router.asPath)");
    expect(subnav).toContain("getSafeInternalReturnPath(router.query?.returnTo");
  });

  test("admin application triage state is URL-backed for refresh/back/deep links", () => {
    const source = read("src/pages/superadmin/sections/JobApplications.js");
    expect(source).toContain("updateApplicationQuery");
    ["status", "q", "source", "dept", "program", "batch", "page", "size"].forEach((key) => {
      expect(source).toContain(`router.query.${key}`);
    });
    expect(source).toContain("handleApplicationsPageChange");
  });

  test("learner Jobs and Notifications preserve explicit navigation context", () => {
    const jobs = read("src/components/Placements/JobsListContent.jsx");
    const detail = read("src/components/Placements/JobDetailContent.jsx");
    const notifications = read("src/components/Notifications/NotificationsContent.jsx");

    expect(jobs).toContain("withReturnTo");
    expect(detail).toContain("getSafeInternalReturnPath(router.query?.returnTo");
    expect(notifications).toContain("router.query?.tab");
    expect(notifications).toContain("{ shallow: true, scroll: false }");
  });

  test("runtime failures stay inside the shell while public 404 remains safely recoverable", () => {
    const boundary = read("src/components/ErrorBoundary/PageErrorBoundary.js");
    const notFound = read("src/pages/404.js");
    expect(boundary).toContain("Your LMS navigation is still available");
    expect(notFound).toContain("Go back");
    expect(notFound).toMatch(/Go to home/i);
    expect(notFound).toContain("Custom404.nolayout = true");
  });
});
