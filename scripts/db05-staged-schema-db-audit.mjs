#!/usr/bin/env node
/**
 * DB-008 non-destructive PostgreSQL introspection gate.
 * This does not create tables, run migrations, mutate data or attest races.
 *
 * Intended AFTER W01 migration integration, with a disposable PG database:
 * DB05_DISPOSABLE_DATABASE_URL=postgres://... \
 * DB05_ALLOW_READONLY_PROBE=YES_ON_NONPROD \
 * node scripts/db05-staged-schema-db-audit.mjs --json
 *
 * Exit 0: only these two structural objects have been observed correct.
 * Exit 2: absent/drifted structures or safety preconditions not met.
 * Other DB05 migration/tenant/race and application gates stay OPEN.
 */
import pg from "pg";

const { Client } = pg;
const now = new Date().toISOString();
const checks = [];
const report = {
  taskId: "DB-008",
  verificationKind: "READ_ONLY_POSTGRES_CATALOG_FOR_TWO_DB05_STAGED_TABLES",
  startedAt: now,
  nodeVersion: process.version,
  database: null,
  serverVersion: null,
  gitSha: process.env.GITHUB_SHA || process.env.DB05_VERIFIED_GIT_SHA || null,
  checks,
  passed: false,
  doesNotProve: [
    "full numbered journal replay", "cross-tenant data isolation",
    "concurrent write safety", "API/FE producer-consumer behavior",
    "other five DB05 primary migration drafts and companion guards",
  ],
};
function check(name, observed, wanted = true, info = null) {
  checks.push({
    name, passed: Object.is(observed, wanted),
    expected: wanted, observed, ...(info ? { info } : {}),
  });
}
function output() {
  report.passed = checks.length > 0 && checks.every((v) => v.passed);
  report.finishedAt = new Date().toISOString();
  process.stdout.write(
    process.argv.includes("--json")
      ? JSON.stringify(report, null, 2) + "\n"
      : report.passed
        ? "DB05 catalog structure: PASS (not a migration/race/tenant verification)\n"
        : "DB05 catalog structure: BLOCKED; run with --json for evidence\n",
  );
  if (!report.passed) process.exitCode = 2;
}
const url = process.env.DB05_DISPOSABLE_DATABASE_URL;
if (
  process.env.DB05_ALLOW_READONLY_PROBE !== "YES_ON_NONPROD" ||
  !url ||
  process.env.NODE_ENV === "production"
) {
  check("explicit disposable database opt-in", false);
  output();
} else {
  let client;
  try {
    const parsed = new URL(url);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      throw new Error("Only PostgreSQL URLs accepted.");
    }
    if (/prod|production/i.test(decodeURIComponent(parsed.pathname))) {
      throw new Error("Refusing database with production-like name.");
    }
    client = new Client({
      connectionString: url,
      application_name: "db05_readonly_catalog_audit",
      statement_timeout: 10000,
      query_timeout: 15000,
    });
    await client.connect();
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY");
    const identity = await client.query(
      "SELECT current_database() AS database_name, current_schema() AS schema_name, " +
      "current_setting('server_version') AS server_version",
    );
    report.database = identity.rows[0]?.database_name || null;
    report.serverVersion = identity.rows[0]?.server_version || null;
    const schema = identity.rows[0]?.schema_name;
    const expectedColumns = {
      lesson_content_discussions: [
        "id", "college_id", "lesson_content_id", "author_membership_id",
        "author_unique_name_snapshot", "author_profile_name_snapshot",
        "content_text", "sequence", "parent_discussion_id",
        "discussion_status", "is_faculty_answer", "resolved_at",
        "resolved_by_membership_id", "attachment_object_key",
        "deleted_at", "created_at", "updated_at",
      ],
      lesson_content_settings: [
        "lesson_content_id", "allow_discussions", "view_after_schedule",
        "view_before_schedule", "html_content", "plain_text",
        "legacy_due_date_raw", "calendar_event_id", "calendar_time_zone",
        "thumbnail_url", "version", "updated_by_user_id",
        "created_at", "updated_at",
      ],
    };
    const catalog = await client.query(
      "SELECT table_name, column_name, data_type, is_nullable " +
      "FROM information_schema.columns " +
      "WHERE table_schema = $1 AND table_name = ANY($2::text[])",
      [schema, Object.keys(expectedColumns)],
    );
    for (const [table, columns] of Object.entries(expectedColumns)) {
      const actual = catalog.rows
        .filter((v) => v.table_name === table)
        .map((v) => v.column_name).sort();
      const expected = [...columns].sort();
      check(table + ".exists", actual.length > 0);
      check(table + ".exact_columns", JSON.stringify(actual), JSON.stringify(expected));
    }
    const nulls = Object.fromEntries(catalog.rows.map(
      (v) => [v.table_name + "." + v.column_name, v.is_nullable]
    ));
    for (const key of [
      "lesson_content_discussions.content_text",
      "lesson_content_discussions.lesson_content_id",
      "lesson_content_discussions.author_membership_id",
      "lesson_content_settings.lesson_content_id",
      "lesson_content_settings.version",
      "lesson_content_settings.updated_by_user_id",
    ]) {
      check(key + ".not_null", nulls[key] === "NO");
    }
    const constraints = await client.query(
      "SELECT tbl.relname AS table_name, con.conname, con.contype, " +
      "pg_get_constraintdef(con.oid) AS definition " +
      "FROM pg_constraint con JOIN pg_class tbl ON tbl.oid = con.conrelid " +
      "JOIN pg_namespace ns ON ns.oid = tbl.relnamespace " +
      "WHERE ns.nspname = $1 AND tbl.relname = ANY($2::text[])",
      [schema, Object.keys(expectedColumns)],
    );
    const byName = new Map(constraints.rows.map((v) => [v.conname, v]));
    for (const [name, type] of [
      ["lesson_content_discussions_pkey", "p"],
      ["lesson_content_discussions_id_content_uq", "u"],
      ["lesson_content_discussions_parent_content_fk", "f"],
      ["lesson_content_discussions_text_ck", "c"],
      ["lesson_content_discussions_parent_not_self_ck", "c"],
      ["lesson_content_settings_pkey", "p"],
      ["db05_lesson_content_settings_version_nonnegative_ck", "c"],
    ]) check("constraint." + name, byName.get(name)?.contype ?? null, type);
    const composite = byName.get("lesson_content_discussions_parent_content_fk")?.definition ?? "";
    check("discussion.parent_content_composite_fk",
      composite.includes("(parent_discussion_id, lesson_content_id)") &&
      composite.includes("(id, lesson_content_id)"));
    const indexRows = await client.query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 " +
      "AND tablename = ANY($2::text[])",
      [schema, Object.keys(expectedColumns)],
    );
    const indexes = new Map(indexRows.rows.map((v) => [v.indexname, v.indexdef]));
    for (const name of [
      "lesson_content_discussions_content_created_idx",
      "lesson_content_discussions_author_idx",
      "lesson_content_discussions_parent_idx",
      "db05_lesson_content_settings_updated_idx",
    ]) check("index." + name, indexes.has(name));
    check("active_discussion_partial_index",
      /WHERE \(deleted_at IS NULL\)/i.test(
        indexes.get("lesson_content_discussions_content_created_idx") ?? ""
      ));
    const triggers = await client.query(
      "SELECT tg.tgname, tg.tgenabled, proname, pg_get_functiondef(p.oid) AS body " +
      "FROM pg_trigger tg JOIN pg_class tab ON tab.oid=tg.tgrelid " +
      "JOIN pg_namespace ns ON ns.oid=tab.relnamespace " +
      "JOIN pg_proc p ON p.oid=tg.tgfoid " +
      "WHERE ns.nspname=$1 AND tab.relname='lesson_content_discussions' " +
      "AND NOT tg.tgisinternal",
      [schema],
    );
    const guard = triggers.rows.find(
      (v) => v.tgname === "db05_lesson_discussions_tenant_before_write"
    );
    check("discussion.tenant_guard_enabled", guard?.tgenabled === "O" || guard?.tgenabled === "A");
    check("discussion.tenant_guard_strengthened",
      ["course_department_college_id", "content_period_college_id",
       "author_college_id", "section_cohort_id", "offering_cohort_id"]
        .every((v) => (guard?.body ?? "").includes(v)));
    await client.query("COMMIT");
  } catch (error) {
    check("database probe completed", false, true,
      error instanceof Error ? error.message : String(error));
    try { if (client) await client.query("ROLLBACK"); } catch {}
  } finally {
    if (client) await client.end().catch(() => {});
  }
  output();
}
