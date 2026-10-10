import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const staged = read("src/db/schema/db01-auth-handoffs.staged.ts");
const activeIndex = read("src/db/schema/index.ts");
const contract = read(
  "docs/planning/db01-cross-host-handoff-contract.md",
);

describe("DB01 staged cross-host auth handoff contract", () => {
  it("stores only a one-way handoff-code hash and lifecycle metadata", () => {
    expect(staged).toContain('"identity_auth_handoffs"');
    expect(staged).toContain('"code_hash"');
    expect(staged).toContain('"target_host"');
    expect(staged).toContain('"expires_at"');
    expect(staged).toContain('"consumed_at"');

    expect(staged).not.toContain('"access_token"');
    expect(staged).not.toContain('"refresh_token"');
    expect(staged).not.toContain('"id_token"');
    expect(staged).not.toContain('"session_cookie"');
  });

  it("remains outside the active schema until migration integration", () => {
    expect(activeIndex).not.toContain("./db01-auth-handoffs.staged");
  });

  it("requires host binding, atomic one-time consume, and current-scope revalidation", () => {
    expect(contract).toContain("Consumption from any other host fails closed");
    expect(contract).toContain("Atomically consume exactly once");
    expect(contract).toContain(
      "Re-read the canonical user, membership, college, organization and domain status",
    );
    expect(contract).toContain(
      "Never persist or return a Firebase refresh token",
    );
  });
});
