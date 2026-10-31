import { readFileSync } from "node:fs";
import { Client } from "pg";
import { expect, it } from "vitest";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { canonicalPgTypeLabel } from "../../scripts/db020-sql-type.mjs";

const run = process.env.DB03_ISOLATED_TEST_DATABASE === "1" &&
  Boolean(process.env.TEST_DATABASE_URL) ? it : it.skip;
const unqualify = (name: string) => name.startsWith("public.") ? name.slice(7) : name;
const fkKey = (fk: {
  child: string; parent: string; from: string[]; to: string[];
  onDelete: string; onUpdate: string;
}) => [fk.child, fk.parent, fk.from.join(","), fk.to.join(","),
  fk.onDelete, fk.onUpdate].join("|");

run("DB001 metadata-only snapshot reflects registered PostgreSQL17 tables, typed columns, CHECKs, indexes and FK shapes", async () => {
  assertDb018DisposableTarget(process.env, { serviceBound: true });
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8"));
  const snapshot = JSON.parse(readFileSync(
    "drizzle/meta/" + String(journal.entries.at(-1).idx).padStart(4, "0") + "_snapshot.json",
    "utf8",
  ));
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    query_timeout: 30_000,
  });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const major = Number((await client.query("SHOW server_version_num")).rows[0].server_version_num);
    expect(major).toBeGreaterThanOrEqual(170000);
    expect(major).toBeLessThan(180000);
    const applied = Number((await client.query(
      "SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations",
    )).rows[0].n);
    expect(applied).toBe(journal.entries.length);

    const catalogTables = new Set((await client.query(
      "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace " +
      "WHERE n.nspname='public' AND c.relkind IN ('r','p')",
    )).rows.map(r => r.name as string));
    const typed = Object.entries(snapshot.tables) as Array<[string, any]>;
    const missingTables = typed.map(([key]) => unqualify(key))
      .filter(name => !catalogTables.has(name));
    expect(missingTables).toEqual([]);

    const columns = (await client.query(
      "SELECT c.relname AS table_name, a.attname AS column_name, " +
      "format_type(a.atttypid,a.atttypmod) AS pg_type, a.attnotnull, " +
      "pg_get_expr(d.adbin,d.adrelid) AS pg_default " +
      "FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid " +
      "JOIN pg_namespace n ON n.oid=c.relnamespace " +
      "LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum " +
      "WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attnum>0 AND NOT a.attisdropped",
    )).rows;
    const liveColumns = new Map(columns.map(c => [c.table_name + "." + c.column_name, c]));
    const missing: string[] = [], nullDrift: string[] = [];
    const typeDrift: string[] = [], defaultDrift: string[] = [];
    const typedColumnNames = new Set<string>();
    for (const [key, table] of typed) {
      const name = unqualify(key);
      for (const column of Object.values(table.columns) as any[]) {
        const id = name + "." + column.name;
        typedColumnNames.add(id);
        const physical = liveColumns.get(id);
        if (!physical) { missing.push(id); continue; }
        if (Boolean(column.notNull) !== Boolean(physical.attnotnull)) nullDrift.push(id);
        const modelType = canonicalPgTypeLabel(String(column.type).toLowerCase());
        const liveType = canonicalPgTypeLabel(String(physical.pg_type).toLowerCase());
        const serialAlias = id === "placement_eligibility_events.sequence" &&
          column.type === "bigserial" && physical.pg_type === "bigint" &&
          /^nextval\('[^']+'::regclass\)$/.test(physical.pg_default ?? "");
        if (modelType !== liveType && !serialAlias) typeDrift.push(id);
        const hasModelDefault = column.default !== undefined && column.default !== null;
        const hasPhysicalDefault = physical.pg_default != null;
        if (hasModelDefault !== hasPhysicalDefault && !serialAlias) defaultDrift.push(id);
      }
    }
    const extraColumns = [...liveColumns.keys()].filter(id =>
      typed.some(([key]) => id.startsWith(unqualify(key) + ".")) && !typedColumnNames.has(id));
    expect({ missing, nullDrift, typeDrift, defaultDrift, extraColumns }).toEqual({
      missing: [], nullDrift: [], typeDrift: [], defaultDrift: [], extraColumns: [],
    });

    const checks = new Set((await client.query(
      "SELECT cl.relname AS table_name, c.conname FROM pg_constraint c " +
      "JOIN pg_class cl ON cl.oid=c.conrelid JOIN pg_namespace n ON n.oid=cl.relnamespace " +
      "WHERE n.nspname='public' AND c.contype='c' AND c.convalidated",
    )).rows.map(r => r.table_name + "." + r.conname));
    const missingChecks = typed.flatMap(([key, table]) =>
      Object.keys(table.checkConstraints ?? {}).map(name => unqualify(key) + "." + name)
        .filter(id => !checks.has(id)));
    expect(missingChecks).toEqual([]);

    const indexes = new Set((await client.query(
      "SELECT t.relname AS table_name, i.relname AS index_name FROM pg_index ix " +
      "JOIN pg_class i ON i.oid=ix.indexrelid JOIN pg_class t ON t.oid=ix.indrelid " +
      "JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND ix.indisvalid",
    )).rows.map(r => r.table_name + "." + r.index_name));
    const missingIndexes = typed.flatMap(([key, table]) =>
      Object.keys(table.indexes ?? {}).map(name => unqualify(key) + "." + name)
        .filter(id => !indexes.has(id)));
    expect(missingIndexes).toEqual([]);

    const action: Record<string, string> = {
      a: "no action", r: "restrict", c: "cascade", n: "set null", d: "set default",
    };
    const rows = (await client.query(
      "SELECT c.conname, c.convalidated, c.condeferrable, c.condeferred, " +
      "cl.relname AS child, parent.relname AS parent, c.confdeltype, c.confupdtype, " +
      "ARRAY(SELECT a.attname::text FROM unnest(c.conkey) WITH ORDINALITY k(attnum,ord) " +
      "JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns_from, " +
      "ARRAY(SELECT a.attname::text FROM unnest(c.confkey) WITH ORDINALITY k(attnum,ord) " +
      "JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=k.attnum ORDER BY k.ord) AS columns_to " +
      "FROM pg_constraint c JOIN pg_class cl ON cl.oid=c.conrelid " +
      "JOIN pg_class parent ON parent.oid=c.confrelid " +
      "JOIN pg_namespace n ON n.oid=cl.relnamespace " +
      "WHERE n.nspname='public' AND c.contype='f'",
    )).rows;
    expect(rows.filter(x => !x.convalidated).map(x => x.child + "." + x.conname)).toEqual([]);
    const physicalFks = new Set(rows.map(row => fkKey({
      child: row.child, parent: row.parent,
      from: row.columns_from, to: row.columns_to,
      onDelete: action[row.confdeltype] ?? row.confdeltype,
      onUpdate: action[row.confupdtype] ?? row.confupdtype,
    })));
    const missingTypedFks = typed.flatMap(([key, table]) =>
      Object.values(table.foreignKeys ?? {}).map((fk: any) => fkKey({
        child: unqualify(key), parent: unqualify(fk.tableTo),
        from: fk.columnsFrom, to: fk.columnsTo,
        onDelete: fk.onDelete ?? "no action", onUpdate: fk.onUpdate ?? "no action",
      })).filter(id => !physicalFks.has(id)));
    expect(missingTypedFks).toEqual([]);

    for (const name of [
      "project_templates_current_version_snapshot_fk",
      "project_templates_published_version_snapshot_fk",
    ]) {
      expect(rows.some(row => row.child === "project_templates" &&
        row.conname === name && row.convalidated && row.condeferrable && row.condeferred)).toBe(true);
    }
    await client.query("COMMIT");
  } finally {
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
  }
}, 120_000);
