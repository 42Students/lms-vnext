import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection, getDb } from "@/db/client";
import { recordActivity } from "@/modules/activity/record-activity";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/** recordActivity against the real table: one row per dedupe key, credential-like metadata never stored. */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-record-activity needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });
const marker = "sec-record-activity-" + randomUUID();

afterAll(async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL session_replication_role = replica");
    await client.query("DELETE FROM activity_events WHERE group_key = $1", [marker]);
    await client.query("COMMIT");
  } finally {
    client.release();
    await pool.end();
    await closeDatabaseConnection();
  }
});

describe("recordActivity on PostgreSQL", () => {
  it("writes once per dedupe key and keeps secrets out of the stored metadata", async () => {
    const input = {
      module: "PLATFORM", eventType: "test.record", subjectType: "test", subjectId: marker, summary: "record test",
      groupKey: marker, dedupeKey: marker + ":one", metadata: { origin: "TEST", password: "hunter2", token: "tok-123" },
    };
    expect(await recordActivity(getDb() as never, input)).toEqual({ recorded: true });
    expect(await recordActivity(getDb() as never, input)).toEqual({ recorded: false });
    const { rows } = await pool.query("SELECT metadata, importance FROM activity_events WHERE group_key = $1", [marker]);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows[0].metadata)).not.toMatch(/hunter2|tok-123/);
    expect(rows[0].metadata.origin).toBe("TEST");
    expect(rows[0].importance).toBe("NORMAL");
  });
});
