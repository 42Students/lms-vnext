import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("chat-12 verify2 privileged tracker log view", () => {
  it("requires a named unscoped Super Admin and audits each authorized explorer read", () => {
    const page = readFileSync(join(process.cwd(), "src/app/(authenticated)/tracker/logs/page.tsx"), "utf8");
    expect(page).toContain('context.user.platformStatus !== "ACTIVE" || !isSuperAdmin(context) ||');
    expect(page).toContain("context.adminScope?.collegeId || context.adminScope?.organizationId");
    
    expect(page).toContain("actorUserId: context.user.id");
    expect(page).toContain('eventType: "platform.tracker.logs_viewed"');
    expect(page).toContain('subjectType: "tracker_logs"');
    expect(page).toContain('metadata: { access: "named_super_admin" }');
    expect(page).not.toContain("passwordHash");
    expect(page).not.toContain("logQuery: search.query");
    const scopeCheck = page.indexOf('context.user.platformStatus !== "ACTIVE" || !isSuperAdmin(context)');
    const audit = page.indexOf('eventType: "platform.tracker.logs_viewed"');
    const explorer = page.indexOf("<TrackerLiveLogsExplorer");
    expect(scopeCheck).toBeGreaterThan(-1);
    expect(scopeCheck).toBeLessThan(audit);
    expect(audit).toBeLessThan(explorer);
  });
});
