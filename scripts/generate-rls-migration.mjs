#!/usr/bin/env node
// Emits the next drizzle migration that adds tenant row-level-security policies for every table that
// has a college_id column but no policy yet. Also writes the journal entry and a snapshot copy.
// Policies are INERT until a human sets `app.rls_mode = 'enforce'` on the database (see
// docs/security/rls-rollout.md), so merging this changes no behaviour by itself.
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { analyse } from "./rls-tenant-tables.mjs";

const { missing } = analyse();
if (!missing.length) {
  console.log("every tenant table already has a policy");
  process.exit(0);
}

const journalPath = "drizzle/meta/_journal.json";
const journal = JSON.parse(readFileSync(journalPath, "utf8"));
const last = journal.entries[journal.entries.length - 1];
const idx = last.idx + 1;
const num = String(idx).padStart(4, "0");
const tag = `${num}_rls_tenant_policies`;

const first = !existsSync("drizzle/0001_x") && !readdirSync("drizzle").some((f) => f.includes("rls_tenant_policies"));
const header = first
  ? `-- Tenant row-level security (docs/security/central-security-architecture.md, layer L5).
-- INERT by default: app_rls_allows() returns true unless the database setting app.rls_mode = 'enforce'.
-- Enforcement is switched on per environment by a human (docs/security/rls-rollout.md), after the
-- per-table review there. Superusers and BYPASSRLS roles are never subject to policies; the runtime
-- role must not be either (src/db/runtime-principal-policy.ts already enforces that in production).
CREATE OR REPLACE FUNCTION app_rls_allows(row_college uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.rls_mode', true), '') <> 'enforce'
      OR current_setting('app.platform', true) = 'on'
      OR coalesce(current_setting('app.system', true), '') <> ''
      OR row_college = nullif(current_setting('app.college_id', true), '')::uuid
$$;
--> statement-breakpoint
-- Explicit, because hardened databases revoke default function execution from PUBLIC.
GRANT EXECUTE ON FUNCTION app_rls_allows(uuid) TO PUBLIC;
--> statement-breakpoint
`
  : "";

const body = missing
  .map(
    (t) => `ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON "${t}";
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "${t}" USING (app_rls_allows("college_id")) WITH CHECK (app_rls_allows("college_id"));`,
  )
  .join("\n--> statement-breakpoint\n");

writeFileSync(`drizzle/${tag}.sql`, header + body + "\n");
journal.entries.push({ idx, version: last.version, when: last.when + 60000, tag, breakpoints: true });
writeFileSync(journalPath, JSON.stringify(journal, null, 2) + "\n");

const prevSnapshot = `drizzle/meta/${String(last.idx).padStart(4, "0")}_snapshot.json`;
const snap = JSON.parse(readFileSync(prevSnapshot, "utf8"));
snap.prevId = snap.id;
snap.id = `d0b3${num}-a1ca-4${num.slice(1)}-b008-2026110${num.padStart(5, "0")}`;
writeFileSync(`drizzle/meta/${num}_snapshot.json`, JSON.stringify(snap));
console.log(`wrote drizzle/${tag}.sql for ${missing.length} tables`);
