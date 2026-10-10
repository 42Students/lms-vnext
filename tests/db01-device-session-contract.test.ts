import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const staged = read("src/db/schema/db01-device-sessions.staged.ts");
const activeIndex = read("src/db/schema/index.ts");
const authSession = read("src/auth/session.ts");

describe("DB01 staged per-device session contract", () => {
  it("captures targeted-revocation metadata without raw authentication secrets", () => {
    expect(staged).toContain('"identity_device_sessions"');
    expect(staged).toContain('"session_key_hash"');
    expect(staged).toContain('"revoked_at"');
    expect(staged).toContain('"expires_at"');
    expect(staged).toContain('"last_used_at"');

    expect(staged).not.toContain('sessionCookie:');
    expect(staged).not.toContain('refreshToken:');
    expect(staged).not.toContain('idToken:');
    expect(staged).not.toContain('"refresh_token"');
    expect(staged).not.toContain('"session_cookie"');
  });

  it("remains deliberately unregistered until the database integrator promotes it", () => {
    expect(activeIndex).not.toContain("./db01-device-sessions.staged");
  });

  it("records the current provider-wide revocation gap rather than pretending parity", () => {
    expect(authSession).toContain("revokeRefreshTokens(identityUid)");
    expect(authSession).not.toContain("identityDeviceSessions");
    expect(staged).toContain("identity_device_sessions_expiry_ck");
    expect(staged).toContain("identity_device_sessions_revoked_ck");
  });
});
