import assert from "node:assert/strict";
import { after, test } from "node:test";
import pg from "pg";
import { assertSafeDb01TestTarget } from "../scripts/db01-test-database-guard.mjs";

/** DB-078 registered-catalog witness. Run only after full clean registered-journal
 * replay against a disposable PostgreSQL database. These columns are retired
 * historical SQL artifacts, NOT active application persistence requirements.
 * The active NewProgramDetailsDTO formal_title is a derived wire response.
 * Never turn this into a legacy MySQL import or add redundant shadow columns. */
if (process.env.DB078_DISPOSABLE !== "1" || !process.env.TEST_DATABASE_URL) {
  throw new Error("DB-078 requires DB078_DISPOSABLE=1 and TEST_DATABASE_URL");
}
assertSafeDb01TestTarget({ ...process.env, DATABASE_URL: "" });
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
after(async () => pool.end());

test("DB-078 registered courses have canonical short_title/name but no retired physical columns", async () => {
  const { rows } = await pool.query(
    `select column_name from information_schema.columns
     where table_schema = current_schema() and table_name = 'courses'`,
  );
  const columns = new Set(rows.map((row) => row.column_name));
  assert.ok(columns.has("id") && columns.has("name") && columns.has("short_title"),
    "Test database must have the registered canonical courses schema");
  for (const historical of [
    "formal_title", "default_subscription_days",
    "legacy_formal_title", "legacy_default_subscription_days",
  ]) {
    assert.equal(columns.has(historical), false,
      historical + " is retired and must not be reintroduced as a mutable shadow column");
  }
});
