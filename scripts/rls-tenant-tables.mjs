// Finds tables that carry a college_id column and tables that already have a tenant RLS policy,
// by reading the committed SQL migrations in order. Shared by the generator and the CI guard.
// This is best-effort static analysis; the authoritative check is scripts/rls-tenant-acceptance.mjs,
// which reads the live catalog of a replayed database in CI.
import { readdirSync, readFileSync } from "node:fs";

const DIR = "drizzle";

export function readMigrations() {
  return readdirSync(DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(`${DIR}/${f}`, "utf8") }));
}

const ident = String.raw`"?(?:public"?\."?)?([A-Za-z0-9_]+)"?`;

/** Text between the opening parenthesis at `open` and its matching close, skipping quoted strings. */
function balancedBody(sql, open) {
  let depth = 0;
  for (let i = open; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      i = sql.indexOf("'", i + 1);
      if (i < 0) break;
    } else if (ch === "(") depth++;
    else if (ch === ")" && --depth === 0) return sql.slice(open + 1, i);
  }
  return sql.slice(open + 1);
}

export function analyse(migrations = readMigrations()) {
  const tables = new Map(); // name -> { college: boolean }
  const policies = new Set();
  for (const { sql } of migrations) {
    for (const m of sql.matchAll(new RegExp(String.raw`CREATE TABLE(?: IF NOT EXISTS)? ${ident}\s*\(`, "g"))) {
      const body = balancedBody(sql, m.index + m[0].length - 1);
      tables.set(m[1], { college: /(^|[\s,(])"?college_id"?\s+uuid/i.test(body) });
    }
    for (const m of sql.matchAll(new RegExp(String.raw`ALTER TABLE(?: ONLY)?(?: IF EXISTS)? ${ident}\s+ADD COLUMN(?: IF NOT EXISTS)? "?college_id"?`, "gi"))) {
      if (tables.has(m[1])) tables.get(m[1]).college = true;
    }
    for (const m of sql.matchAll(new RegExp(String.raw`DROP TABLE(?: IF EXISTS)? ${ident}`, "gi"))) {
      tables.delete(m[1]);
      policies.delete(m[1]);
    }
    for (const m of sql.matchAll(new RegExp(String.raw`CREATE POLICY\s+\S+\s+ON\s+${ident}`, "gi"))) policies.add(m[1]);
  }
  const tenantTables = [...tables].filter(([, v]) => v.college).map(([k]) => k).sort();
  const missing = tenantTables.filter((t) => !policies.has(t));
  return { tenantTables, policies, missing };
}
