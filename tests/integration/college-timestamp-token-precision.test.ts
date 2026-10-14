import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { timestampTokenIso } from "@/modules/academics/optimistic-timestamp-model";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1";
if (enabled) assertDb018DisposableTarget(process.env, {serviceBound:true});
const pool = enabled ? new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}) : null;
const id = randomUUID();
const label = "college-token-" + id.slice(0, 8);

describe.skipIf(!enabled)("College timestamp tokens: SQL default now precision", () => {
  afterAll(async () => {
    try {
      if (pool) await pool.query("DELETE FROM academic_periods WHERE id=$1", [id]);
    } finally { await pool?.end(); }
  });
  it("accepts SQL-default-created rows and rejects the stale token after a change", async () => {
    if (!pool) throw Error("Disposable PostgreSQL required");
    const inserted = await pool.query<{updated_at:Date}>(
      "INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date) " +
      "VALUES($1,$2,$3::text,$3::text,'2026-07-01','2026-12-31') RETURNING updated_at",
      [id,SEED_IDS.collegeA,label],
    );
    const token = timestampTokenIso(inserted.rows[0]!.updated_at);
    const updated = await pool.query(
      "UPDATE academic_periods SET updated_at=updated_at + interval '1 millisecond' " +
      "WHERE id=$1::uuid AND date_trunc('milliseconds',updated_at)=$2::timestamptz RETURNING id",
      [id,token],
    );
    expect(updated.rowCount).toBe(1);
    const stale = await pool.query(
      "UPDATE academic_periods SET updated_at=now() WHERE id=$1::uuid " +
      "AND date_trunc('milliseconds',updated_at)=$2::timestamptz RETURNING id",
      [id,token],
    );
    expect(stale.rowCount).toBe(0);
  });
});
