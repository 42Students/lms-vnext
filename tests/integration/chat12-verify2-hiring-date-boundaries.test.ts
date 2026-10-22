import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import {
  istStartOfDay, istStartOfNextDay,
} from "@/modules/admin-ui/super-admin-hiring-ist-boundary";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests");
const pool = new Pool({ connectionString: databaseUrl, max: 1 });

afterAll(async () => { await pool.end(); });

describe("chat-12 verify2 hiring-report PostgreSQL IST day range", () => {
  it("includes the complete 22 Oct 2026 local day and excludes the next midnight", async () => {
    const from = istStartOfDay("2026-10-22");
    const until = istStartOfNextDay("2026-10-22");
    const { rows } = await pool.query<{ inside: boolean }>(
      `select occurred_at >= $1::timestamptz and occurred_at < $2::timestamptz as inside
       from (values ($3::timestamptz), ($4::timestamptz), ($5::timestamptz),
                    ($6::timestamptz)) as boundary(occurred_at)`,
      [
        from.toISOString(), until.toISOString(),
        "2026-10-21T18:29:59.999Z", "2026-10-21T18:30:00.000Z",
        "2026-10-22T18:29:59.999Z", "2026-10-22T18:30:00.000Z",
      ],
    );
    expect(rows.map(row => row.inside)).toEqual([false, true, true, false]);
  });

  it("keeps the same 24-hour IST window across a leap-day and year rollover", async () => {
    const days = ["2026-12-31", "2028-02-29"];
    for (const day of days) {
      const from = istStartOfDay(day), until = istStartOfNextDay(day);
      const { rows } = await pool.query<{ hours: number }>(
        "select extract(epoch from ($2::timestamptz - $1::timestamptz))/3600 as hours",
        [from.toISOString(), until.toISOString()],
      );
      expect(Number(rows[0]?.hours)).toBe(24);
    }
  });
});
