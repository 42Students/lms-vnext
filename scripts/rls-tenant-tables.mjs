// Finds tables that carry a college_id column and tables that already have a tenant RLS policy,
// by reading the committed SQL migrations in order. Shared by the generator and the CI guard.
import { readdirSync, readFileSync } from "node:fs";

const DIR = "drizzle";

export function readMigrations() {
  return readdirSync(DIR)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(`${DIR}/${f}`, "utf8") }));
}

const ident = String.raw`"?(?:public"?\."?)?([A-Za-z0-9_]+)"?`;

export function analyse(migrations = readMigrations()) {
  const tables = new Map(); // name -> { college: boolean }
  const policies = new Set();
  for (const { sql } of migrations) {
    for (const m of sql.matchAll(new RegExp(String.raw`CREATE TABLE(?: IF NOT EXISTS)? ${ident} \(([\s\S]*?)\n\);`, "g"))) {
      tables.set(m[1], { college: /"college_id"\s|\bcollege_id\s+uuid/i.test(m[2]) });
    }
    for (const m of sql.matchAll(new RegExp(String.raw`ALTER TABLE(?: ONLY)? ${ident} ADD COLUMN(?: IF NOT EXISTS)? "?college_id"?`, "gi"))) {
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
