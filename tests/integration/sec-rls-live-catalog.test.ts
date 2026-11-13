import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";

/**
 * Tenant isolation proof on the LIVE catalog of a migrated, disposable database (TEST_DATABASE_URL only).
 *
 * The CI acceptance script proves the policy text on a probe table. This test proves the real tables:
 *  1. every public table is either RLS-enabled, FORCED and policied, or explicitly classified as not tenant data
 *     (docs/security/table-classification.json). A new table can therefore never ship unprotected and unreviewed;
 *  2. under enforce mode a non-owner role sees nothing without a scope, only its own college with one, and cannot
 *     write another college's row, on real tenant tables.
 *
 * Everything runs inside one transaction that is rolled back, including the throwaway role.
 */
const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) throw new Error("sec-rls-live-catalog needs an explicit TEST_DATABASE_URL (disposable database)");
if (!["127.0.0.1", "localhost", "::1"].includes(new URL(connectionString).hostname)) {
  throw new Error("refusing a non-local database host");
}

const pool = new Pool({ connectionString, max: 1 });
afterAll(async () => {
  await pool.end();
});

type Classification = Record<string, string[] | string>;
const classification = JSON.parse(readFileSync("docs/security/table-classification.json", "utf8")) as Classification;
const classifiedNotTenant = new Set<string>(
  ["user_owned_unscoped", "infrastructure_unscoped", "platform_reference_unscoped", "identity_core_pending_review"].flatMap(
    (key) => (classification[key] as string[]) ?? [],
  ),
);
const identityCorePolicied = new Set<string>((classification["identity_core_policied"] as string[]) ?? []);
// Bookkeeping tables of the migration tool and of probe scripts are not application data.
const toolTables = new Set(["__drizzle_migrations", "rls_probe"]);

async function inRolledBackTransaction(run: (client: PoolClient) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await run(client);
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    client.release();
  }
}

describe("tenant row-level security on the real tables", () => {
  it("every public table is RLS-forced and policied, or explicitly classified as not tenant data", async () => {
    const result = await pool.query<{ name: string; rls: boolean; forced: boolean; policies: number }>(`
      SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced,
             (SELECT count(*)::int FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
       WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition
       ORDER BY c.relname`);
    expect(result.rowCount).toBeGreaterThan(100);

    const unprotected: string[] = [];
    const protectedButNotForced: string[] = [];
    for (const row of result.rows) {
      if (toolTables.has(row.name)) continue;
      const policied = row.rls && row.policies > 0;
      if (policied) {
        if (!row.forced) protectedButNotForced.push(row.name);
        continue;
      }
      if (classifiedNotTenant.has(row.name)) continue;
      unprotected.push(row.name);
    }
    // Table owners ignore RLS unless it is FORCED; the runtime role owns the tables, so FORCE is what makes it real.
    expect(protectedButNotForced, "RLS enabled but not FORCED").toEqual([]);
    expect(unprotected, "tables with no RLS policy and no classification (add a policy or classify with a reason)").toEqual([]);
  });

  it("the tables classified as not tenant data really carry no college_id", async () => {
    const result = await pool.query<{ name: string }>(
      `SELECT DISTINCT table_name AS name FROM information_schema.columns
        WHERE table_schema = 'public' AND column_name = 'college_id' AND table_name = ANY($1)`,
      [[...classifiedNotTenant]],
    );
    expect(result.rows.map((r) => r.name)).toEqual([]);
  });

  it("core identity tables named as policied really have a policy", async () => {
    const result = await pool.query<{ tablename: string }>(
      `SELECT DISTINCT tablename FROM pg_policies WHERE schemaname = 'public' AND tablename = ANY($1)`,
      [[...identityCorePolicied]],
    );
    expect(result.rows.map((r) => r.tablename).sort()).toEqual([...identityCorePolicied].sort());
  });

  it("enforce mode isolates colleges on real tenant tables for a non-owner role", async () => {
    await inRolledBackTransaction(async (client) => {
      const colleges = await client.query<{ id: string }>(`SELECT id FROM colleges ORDER BY id LIMIT 2`);
      if ((colleges.rowCount ?? 0) < 2) return; // a database with fewer than two colleges cannot show isolation
      const [a, b] = colleges.rows.map((r) => r.id) as [string, string];

      // Tables with a direct college_id and rows for both colleges, chosen from the live catalog.
      const candidates = await client.query<{ name: string }>(`
        SELECT c.relname AS name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
          JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'college_id' AND NOT a.attisdropped
         WHERE c.relkind = 'r' AND c.relrowsecurity AND c.relforcerowsecurity
           AND c.relname NOT IN ('colleges', 'rls_probe')
         ORDER BY c.relname`);
      const tested: string[] = [];
      for (const { name } of candidates.rows) {
        const counts = await client.query<{ a: number; b: number }>(
          `SELECT count(*) FILTER (WHERE college_id = $1)::int AS a, count(*) FILTER (WHERE college_id = $2)::int AS b FROM "${name}"`,
          [a, b],
        );
        if ((counts.rows[0]?.a ?? 0) > 0 && (counts.rows[0]?.b ?? 0) > 0) tested.push(name);
        if (tested.length >= 6) break;
      }
      expect(tested.length, "need tenant tables holding rows for two colleges (seed data)").toBeGreaterThan(0);

      await client.query(`CREATE ROLE sec_rls_probe_app NOLOGIN NOSUPERUSER NOBYPASSRLS`);
      await client.query(`GRANT USAGE ON SCHEMA public TO sec_rls_probe_app`);
      for (const name of tested) await client.query(`GRANT SELECT, UPDATE, DELETE ON "${name}" TO sec_rls_probe_app`);
      await client.query(`GRANT SELECT ON colleges TO sec_rls_probe_app`);
      await client.query(`SET LOCAL ROLE sec_rls_probe_app`);
      await client.query(`SELECT set_config('app.rls_mode', 'enforce', true)`);

      const setScope = async (collegeId: string, platform = "", system = "") => {
        await client.query(
          `SELECT set_config('app.college_id', $1, true), set_config('app.platform', $2, true), set_config('app.system', $3, true)`,
          [collegeId, platform, system],
        );
      };
      const count = async (table: string, where = "") =>
        Number((await client.query(`SELECT count(*)::int AS n FROM "${table}" ${where}`)).rows[0]?.n);

      for (const table of tested) {
        await setScope("");
        expect(await count(table), `${table}: no scope must see nothing`).toBe(0);

        await setScope(a);
        expect(await count(table, `WHERE college_id = '${b}'`), `${table}: college A must not see B`).toBe(0);
        expect(await count(table, `WHERE college_id = '${a}'`), `${table}: college A sees its own rows`).toBeGreaterThan(0);

        await setScope(b);
        expect(await count(table, `WHERE college_id = '${a}'`), `${table}: college B must not see A`).toBe(0);

        // A foreign row can be neither updated nor deleted.
        await setScope(a);
        const updated = await client.query(`UPDATE "${table}" SET college_id = college_id WHERE college_id = '${b}'`);
        expect(updated.rowCount, `${table}: A must not update B rows`).toBe(0);
        const deleted = await client.query(`DELETE FROM "${table}" WHERE college_id = '${b}'`);
        expect(deleted.rowCount, `${table}: A must not delete B rows`).toBe(0);

        // Platform and named system scopes see every college.
        await setScope("", "on");
        expect(await count(table, `WHERE college_id = '${b}'`), `${table}: platform scope sees all`).toBeGreaterThan(0);
        await setScope("", "", "sec-test");
        expect(await count(table, `WHERE college_id = '${a}'`), `${table}: system scope sees all`).toBeGreaterThan(0);
      }

      // A malformed college id must error, never widen access.
      await client.query("SAVEPOINT malformed");
      await client.query(`SELECT set_config('app.college_id', 'not-a-uuid', true), set_config('app.platform', '', true), set_config('app.system', '', true)`);
      await expect(client.query(`SELECT count(*) FROM "${tested[0]}"`)).rejects.toThrow();
      await client.query("ROLLBACK TO SAVEPOINT malformed");
    });
  });
});
