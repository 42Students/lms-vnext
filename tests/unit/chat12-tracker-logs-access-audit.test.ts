import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/(authenticated)/tracker/logs/page.tsx", "utf8");

describe("chat-12: tracker log access audit parity", () => {
  it("audits allowed and denied log views using the named account, never raw request data", () => {
    expect(source).toContain('context.user.platformStatus !== "ACTIVE"');
    expect(source).toContain('eventType: "platform.tracker.logs_access_denied"');
    expect(source).toContain('eventType: "platform.tracker.logs_viewed"');
    expect(source.match(/actorUserId: context.user.id/g)).toHaveLength(2);
    expect(source).toContain('metadata: { access: "named_account", outcome: "denied" }');
    expect(source).toContain('metadata: { access: "named_super_admin" }');
    expect(source).not.toMatch(/metadata:\s*\{[^}]*\b(?:query|ip|token|password|header):/);
  });
});
