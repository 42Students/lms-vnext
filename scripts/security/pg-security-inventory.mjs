#!/usr/bin/env node
// Database security inventory and drift check (SEC-06-001, 002, 004, 008, SEC-07-002, 011, 012, 019).
//   DATABASE_URL=<any login that can read the catalog> node scripts/security/pg-security-inventory.mjs            print summary
//   ... --json > inventory.json                                                                                      full inventory
//   ... --check docs/security/pg-security-baseline.json                                                              fail on drift
//   ... --write docs/security/pg-security-baseline.json                                                              write baseline
// Read-only. It records, per table: owner, whether row-level security is enabled and forced, the policies and the
// commands each policy covers, and the privileges held by the runtime role; plus roles and attributes, and the
// unique indexes that do not include a tenant column.
import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("set DATABASE_URL");
const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name);
const RUNTIME = process.env.RUNTIME_ROLE ?? "lms_vnext_app";
const MIGRATOR = process.env.MIGRATOR_ROLE ?? "lms_vnext_migrator";

const client = new pg.Client({ connectionString: url });
await client.connect();
const q = async (text, params = []) => (await client.query(text, params)).rows;
try {
  const tables = await q(`
    SELECT c.oid, c.relname AS name, pg_get_userbyid(c.relowner) AS owner, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname`);
  const policies = await q(`
    SELECT c.relname AS table, p.polname AS name, p.polcmd AS cmd
      FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' ORDER BY 1, 2`);
  const columns = await q(`
    SELECT table_name AS "table", column_name AS col FROM information_schema.columns
     WHERE table_schema = 'public' AND column_name IN ('college_id', 'organization_id')`);
  const grants = await q(
    `SELECT table_name AS "table", string_agg(privilege_type, ',' ORDER BY privilege_type) AS privs
       FROM information_schema.role_table_grants WHERE table_schema = 'public' AND grantee = $1 GROUP BY 1`,
    [RUNTIME],
  );
  const roles = await q(`
    SELECT rolname AS name, rolsuper AS super, rolcreaterole AS createrole, rolcreatedb AS createdb, rolbypassrls AS bypassrls, rolcanlogin AS login
      FROM pg_roles WHERE rolname IN ($1, $2) ORDER BY 1`, [RUNTIME, MIGRATOR]);
  const definers = await q(`
    SELECT p.proname AS name FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef ORDER BY 1`);
  const uniques = await q(`
    SELECT t.relname AS "table", i.relname AS index, pg_get_indexdef(i.oid) AS def
      FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid JOIN pg_class t ON t.oid = x.indrelid JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public' AND x.indisunique AND NOT x.indisprimary ORDER BY 1, 2`);
  const constraints = await q(`
    SELECT t.relname AS "table", count(*) FILTER (WHERE c.contype = 'f')::int AS fks, count(*) FILTER (WHERE c.contype = 'c')::int AS checks, count(*) FILTER (WHERE c.contype = 'u')::int AS uniques
      FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE n.nspname = 'public' GROUP BY 1 ORDER BY 1`);

  const policyByTable = new Map();
  for (const p of policies) {
    const list = policyByTable.get(p.table) ?? [];
    list.push({ name: p.name, cmd: p.cmd });
    policyByTable.set(p.table, list);
  }
  const tenantCols = new Map();
  for (const c of columns) (tenantCols.get(c.table) ?? tenantCols.set(c.table, new Set()).get(c.table)).add(c.col);
  const grantMap = new Map(grants.map((g) => [g.table, g.privs]));
  const cmdName = { "*": "ALL", r: "SELECT", a: "INSERT", w: "UPDATE", d: "DELETE" };

  const inventory = {
    tables: tables.map((t) => {
      const pols = policyByTable.get(t.name) ?? [];
      const cmds = new Set(pols.flatMap((p) => (p.cmd === "*" ? ["SELECT", "INSERT", "UPDATE", "DELETE"] : [cmdName[p.cmd] ?? p.cmd])));
      return {
        name: t.name,
        owner: t.owner,
        rls: t.rls,
        forced: t.forced,
        policies: pols.map((p) => p.name),
        commandsCovered: ["SELECT", "INSERT", "UPDATE", "DELETE"].filter((c) => cmds.has(c)),
        tenantColumn: tenantCols.has(t.name) ? [...tenantCols.get(t.name)].sort() : [],
        runtimeGrants: grantMap.get(t.name) ?? "",
      };
    }),
    roles,
    securityDefinerFunctions: definers.map((d) => d.name),
    uniqueIndexesWithoutTenantColumn: uniques
      .filter((u) => !/college_id|organization_id/.test(u.def))
      .map((u) => ({ table: u.table, index: u.index })),
    constraintCounts: constraints,
  };

  const problems = [];
  for (const t of inventory.tables) {
    if (t.rls && !t.forced) problems.push(`${t.name}: row-level security enabled but not forced`);
    if (t.rls && t.commandsCovered.length < 4) problems.push(`${t.name}: policies cover only ${t.commandsCovered.join("/") || "no command"}`);
    if (/TRUNCATE|REFERENCES|TRIGGER/.test(t.runtimeGrants)) problems.push(`${t.name}: runtime role holds ${t.runtimeGrants}`);
  }
  for (const r of roles) if (r.name === RUNTIME && (r.super || r.createrole || r.createdb || r.bypassrls)) problems.push(`runtime role ${r.name} has elevated attributes`);
  if (inventory.securityDefinerFunctions.length) problems.push(`SECURITY DEFINER functions exist: ${inventory.securityDefinerFunctions.join(", ")}`);

  const summary = {
    tables: inventory.tables.length,
    rlsEnabled: inventory.tables.filter((t) => t.rls).length,
    rlsForced: inventory.tables.filter((t) => t.forced).length,
    ownersOtherThanMigrator: [...new Set(inventory.tables.map((t) => t.owner))].filter((o) => o !== MIGRATOR),
    allCommandsCovered: inventory.tables.filter((t) => t.rls && t.commandsCovered.length === 4).length,
    uniqueIndexesWithoutTenantColumn: inventory.uniqueIndexesWithoutTenantColumn.length,
    problems,
  };
  const fingerprint = { tables: inventory.tables.map((t) => [t.name, t.owner, t.rls, t.forced, t.commandsCovered.join("/"), t.runtimeGrants]), roles, securityDefinerFunctions: inventory.securityDefinerFunctions };

  if (flag("--json") >= 0) console.log(JSON.stringify({ summary, ...inventory }, null, 1));
  else console.log(JSON.stringify(summary, null, 1));
  if (flag("--write") >= 0) {
    writeFileSync(args[flag("--write") + 1], JSON.stringify({ note: "Reviewed baseline of table owners, row-level security flags, policy coverage, runtime grants and role attributes. Regenerate on purpose after a reviewed migration.", ...fingerprint }, null, 1) + "\n");
    console.error("baseline written");
  }
  if (flag("--check") >= 0) {
    const base = JSON.parse(readFileSync(args[flag("--check") + 1], "utf8"));
    const now = JSON.stringify(fingerprint);
    const then = JSON.stringify({ tables: base.tables, roles: base.roles, securityDefinerFunctions: base.securityDefinerFunctions });
    if (now !== then) {
      const before = new Map(base.tables.map((t) => [t[0], JSON.stringify(t)]));
      const drift = fingerprint.tables.filter((t) => before.get(t[0]) !== JSON.stringify(t)).map((t) => t[0]);
      const removed = base.tables.filter((t) => !fingerprint.tables.some((n) => n[0] === t[0])).map((t) => t[0]);
      console.error("DRIFT from the reviewed baseline:", JSON.stringify({ changedOrNew: drift.slice(0, 40), removed: removed.slice(0, 40), rolesChanged: JSON.stringify(roles) !== JSON.stringify(base.roles) }));
      process.exit(1);
    }
    console.error("no drift from the reviewed baseline");
  }
  if (problems.length) {
    console.error("PROBLEMS:\n" + problems.slice(0, 30).join("\n"));
    process.exit(1);
  }
} finally {
  await client.end();
}
