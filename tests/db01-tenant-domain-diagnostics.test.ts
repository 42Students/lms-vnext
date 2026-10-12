import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relative: string) =>
  readFileSync(path.join(root, relative), "utf8");

const activeSchema = read("src/db/schema/tenant-domains.ts");
const stagedSql = read(
  "docs/planning/sql/db01-tenant-domain-diagnostics-staging.sql",
);

const drizzleSql = readdirSync(path.join(root, "drizzle"))
  .filter((name) => name.endsWith(".sql"))
  .map((name) => ({
    name,
    sql: readFileSync(path.join(root, "drizzle", name), "utf8"),
  }));

const activeHasDiagnostic =
  /lastFoundValues\s*:\s*varchar\(\s*["']last_found_values["']\s*,\s*\{\s*length\s*:\s*500\s*\}\s*\)/s.test(
    activeSchema,
  );

const registeredMigration = drizzleSql.find(
  ({ sql }) =>
    /tenant_domains/i.test(sql) &&
    /last_found_values/i.test(sql),
);

describe("DB01 tenant-domain DNS diagnostics staging contract", () => {
  it("keeps the staged change bounded and non-destructive", () => {
    expect(stagedSql).toMatch(
      /alter table tenant_domains\s+add column if not exists last_found_values varchar\(500\)/i,
    );
    expect(stagedSql).not.toMatch(/drop\s+(table|column)/i);
    expect(stagedSql).not.toMatch(/update\s+tenant_domains/i);
    expect(stagedSql).not.toMatch(/is_verified\s*=/i);
  });

  it("requires a registered migration exactly when the active Drizzle schema is promoted", () => {
    if (activeHasDiagnostic) {
      expect(registeredMigration?.name).toBeTruthy();
      return;
    }

    expect(registeredMigration).toBeUndefined();
    expect(stagedSql).toContain(
      "add column if not exists last_found_values varchar(500)",
    );
  });

  it("documents that diagnostics are bounded metadata, not authorization state", () => {
    expect(stagedSql).toContain("at most 500 characters");
    expect(stagedSql).toContain(
      "must never participate in tenant authorization",
    );
    expect(stagedSql).toContain(
      "must not silently clear an already verified domain",
    );
  });
});
