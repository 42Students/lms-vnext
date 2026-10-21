import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("admin-user session modal state contracts", () => {
  test("session fetch failures are explicit and retryable instead of false empty", () => {
    const source = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(source).toContain('setSessionsError(error?.message || "Failed to load sessions")');
    expect(source).toContain('message="Could not load active sessions"');
    expect(source).toContain("openSessions(sessionsFor, { preserveOpen: true })");
    expect(source).toContain("sessionsError && sessions.length === 0 ? null");
    expect(source).toContain('locale={{ emptyText: "No active sessions." }}');
  });

  test("session loading is shape-matched and stale requests are invalidated on close", () => {
    const source = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(source).toContain('TableSkeleton rows={5} columns={4} label="Loading active sessions"');
    expect(source).toContain("sessionsRequestRef");
    expect(source).toContain("request !== sessionsRequestRef.current");
    expect(source).toContain("++sessionsRequestRef.current");
  });
});
