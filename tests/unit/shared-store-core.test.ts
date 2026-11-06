import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { CLAIM_ONCE_SQL, RATE_HIT_SQL, SWEEP_SQL, createSharedStore } from "@/security/shared-store-core";

const dialect = new PgDialect();
const compile = (q: Parameters<Parameters<typeof createSharedStore>[0]>[0]) => dialect.sqlToQuery(q);

describe("shared security store", () => {
  it("claimOnce is true only when the statement returns the key", async () => {
    const run = vi.fn(async () => ({ rows: [{ key: "k" }] }));
    expect(await createSharedStore(run).claimOnce("k", 60)).toBe(true);
    expect(await createSharedStore(async () => ({ rows: [] })).claimOnce("k", 60)).toBe(false);
  });

  it("binds the key and ttl as parameters, never into the SQL text", async () => {
    let compiled: { sql: string; params: unknown[] } | undefined;
    await createSharedStore(async (q) => ((compiled = compile(q)), { rows: [{ key: "k" }] })).claimOnce("webhook:x:'; DROP TABLE a;--", 90.9);
    expect(compiled!.params).toEqual(["webhook:x:'; DROP TABLE a;--", 90]);
    expect(compiled!.sql).not.toContain("DROP TABLE");
    expect(compiled!.sql).toContain("ON CONFLICT (key) DO UPDATE");
  });

  it("hit allows up to the limit and refuses beyond it", async () => {
    let n = 0;
    const store = createSharedStore(async () => ({ rows: [{ count: ++n }] }));
    const results = [];
    for (let i = 0; i < 5; i += 1) results.push(await store.hit("k", 3, 60_000));
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("hit passes the window in milliseconds as a parameter, at least 1", async () => {
    const seen: unknown[][] = [];
    const store = createSharedStore(async (q) => (seen.push(compile(q).params), { rows: [{ count: 1 }] }));
    await store.hit("k", 5, 0);
    await store.hit("k", 5, 60_000);
    expect(seen).toEqual([["k", 1, 1, 1, 1, 1, 1], ["k", 60000, 60000, 60000, 60000, 60000, 60000]].map((r) => r.slice(0, seen[0]!.length)));
  });

  it("keeps the statement text the CI acceptance script runs (single source)", () => {
    expect(CLAIM_ONCE_SQL).toContain("RETURNING key");
    expect(RATE_HIT_SQL).toContain("RETURNING count");
    expect(SWEEP_SQL).toContain("LIMIT 1000");
  });
});
