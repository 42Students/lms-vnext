import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const sql = read("docs/planning/sql/db01-tenant-domain-tombstone-staging.sql");
const contract = read("docs/planning/db01-tenant-domain-tombstone-contract.md");

describe("DB01 staged deleted-domain persistence contract", () => {
  it("keeps the tombstone proposal unregistered and historically attributable", () => {
    expect(sql).toContain("NOT a registered Drizzle migration");
    expect(contract).toContain("UNREGISTERED / NOT EXECUTED");
    expect(sql).toContain("ADD COLUMN deleted_at timestamptz");
    expect(sql).toContain("ADD COLUMN deleted_by_user_id uuid");
  });

  it("blocks a deleted domain from remaining primary", () => {
    expect(sql).toContain("tenant_domains_deleted_nonprimary_ck");
    expect(sql).toContain("deleted_at IS NULL OR is_primary = false");
    expect(sql).toContain("tenant_domains_deletion_metadata_ck");
  });

  it("does not silently relax hostname uniqueness or revive deleted hosts", () => {
    expect(contract).toContain("across both live and deleted rows");
    expect(sql).toContain("Do not let a recheck resurrect a tombstone");
    expect(sql).toContain("tenant_domains_host_uq");
    expect(sql).not.toMatch(/drop\s+index\s+tenant_domains_host_uq/i);
    expect(contract).toContain("all NOT RUN");
  });
});
