/**
 * NSRIT snapshot export (stage 2a: foundation + people).
 *
 * Reads the local legacy MySQL copy `lms_click` with read-only SELECTs through
 * the `mysql` command line client and writes one NDJSON file per table plus
 * manifest.json (row counts + sha256) into a snapshot directory OUTSIDE the
 * repository (the output contains real personal data and must never be
 * committed). Also writes the rejected-rows report and the masked
 * shared-contact review list next to the snapshot.
 *
 *   tsx scripts/migrate/nsrit/export.ts --out=<snapshot dir> [--mysql=<path to mysql client>]
 *
 * Environment (all optional, defaults target the local stack copy):
 *   LEGACY_MYSQL_HOST=127.0.0.1  LEGACY_MYSQL_PORT=3310
 *   LEGACY_MYSQL_USER=root       LEGACY_MYSQL_DB=lms_click
 *   MYSQL_PWD                    (read by the client itself, never logged)
 *
 * Guards: only a loopback MySQL host is accepted, every session is switched to
 * READ ONLY, and secret-looking columns / JSON keys are dropped at export time.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LOADER_VERSION, sha256Hex } from "./common";
import {
  buildSelectSql,
  parseJsonLines,
  scrubSecrets,
  selectableColumns,
  snapshotDigest,
  TABLE_SPECS,
  toNdjson,
  type ColumnInfo,
  type Manifest,
  type ManifestTable,
} from "./export-lib";
import { buildPlan } from "./plan";
import { readSnapshot } from "./snapshot";
import { reviewListCsv, reviewListMarkdown, rejectionReportMarkdown } from "./reports";

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"]);

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

function defaultMysql(): string {
  const candidates = [
    "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe",
    "/usr/bin/mysql",
    "/usr/local/bin/mysql",
  ];
  return candidates.find((p) => existsSync(p)) ?? "mysql";
}

function main() {
  const out = arg("out");
  if (!out) throw new Error("--out=<snapshot directory> is required");
  const resolvedOut = path.resolve(out);
  const repoRoot = path.resolve(__dirname, "../../..");
  if (resolvedOut.startsWith(repoRoot + path.sep)) {
    throw new Error("Refusing to write the snapshot inside the repository (it contains personal data)");
  }
  const host = process.env.LEGACY_MYSQL_HOST ?? "127.0.0.1";
  if (!LOOPBACK.has(host)) {
    throw new Error("Refusing to export from a non-loopback MySQL host");
  }
  const port = process.env.LEGACY_MYSQL_PORT ?? "3310";
  const user = process.env.LEGACY_MYSQL_USER ?? "root";
  const database = process.env.LEGACY_MYSQL_DB ?? "lms_click";
  const mysql = arg("mysql") ?? defaultMysql();

  const run = (sql: string): string => {
    const result = spawnSync(
      mysql,
      [
        `--host=${host}`,
        `--port=${port}`,
        `--user=${user}`,
        "--default-character-set=utf8mb4",
        "--batch",
        "--raw",
        "--skip-column-names",
        "--init-command=SET SESSION TRANSACTION READ ONLY",
        database,
        "-e",
        sql,
      ],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      // stderr can echo SQL but never row data; still keep it short.
      throw new Error(`mysql client failed: ${(result.stderr ?? "").slice(0, 400)}`);
    }
    return result.stdout;
  };

  mkdirSync(resolvedOut, { recursive: true });
  const tables: Record<string, ManifestTable> = {};
  for (const spec of TABLE_SPECS) {
    const columnOutput = run(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '${database.replace(/'/g, "")}' AND table_name = '${spec.table}' ORDER BY ordinal_position`,
    );
    const columns: ColumnInfo[] = columnOutput
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter(Boolean)
      .map((line) => {
        const [name, dataType] = line.split("\t");
        return { name, dataType };
      });
    if (columns.length === 0) throw new Error(`Legacy table ${spec.table} not found`);
    const { kept, denied } = selectableColumns(columns, spec);
    const rows = parseJsonLines(run(buildSelectSql(spec, kept)));
    const counter = { removed: 0 };
    const cleaned = rows.map((row) => scrubSecrets(row, counter) as Record<string, unknown>);
    const text = toNdjson(cleaned);
    const file = `${spec.table}.ndjson`;
    writeFileSync(path.join(resolvedOut, file), text, "utf8");
    tables[spec.table] = {
      file,
      rows: cleaned.length,
      sha256: sha256Hex(Buffer.from(text, "utf8")),
      scope: spec.scope,
      columns: kept.map((k) => k.name),
      deniedColumns: denied,
      scrubbedJsonKeys: counter.removed,
    };
    process.stdout.write(`exported ${spec.table}: ${cleaned.length} rows, ${denied.length} columns withheld\n`);
  }

  const manifest: Manifest = {
    format: "nsrit-snapshot-1",
    exporter: LOADER_VERSION,
    legacyDatabase: database,
    exportedAt: new Date().toISOString(),
    college: { legacyCollegeId: 6, legacyOrgId: 6 },
    snapshotSha256: snapshotDigest(tables),
    tables,
  };
  writeFileSync(path.join(resolvedOut, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  // Reports from the same rules the loader will apply (no database needed).
  const snapshot = readSnapshot(resolvedOut);
  const plan = buildPlan(snapshot);
  writeFileSync(path.join(resolvedOut, "rejected-rows-report.md"), rejectionReportMarkdown(plan), "utf8");
  writeFileSync(path.join(resolvedOut, "contact-review-list.md"), reviewListMarkdown(plan), "utf8");
  writeFileSync(path.join(resolvedOut, "contact-review-list.csv"), reviewListCsv(plan), "utf8");
  process.stdout.write(`snapshot ${manifest.snapshotSha256.slice(0, 12)} written; rejected: ${plan.rejections.length}, deferred: ${plan.deferred.length}, review groups: ${plan.review.length}\n`);
}

main();
