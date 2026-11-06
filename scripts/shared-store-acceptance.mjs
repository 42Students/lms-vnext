// Runs the shared security store statements against a real PostgreSQL (CI database job).
//   DATABASE_URL=postgres://... node scripts/shared-store-acceptance.mjs
import { readFileSync } from "node:fs";
import pg from "pg";

const source = readFileSync(new URL("../src/security/shared-store-core.ts", import.meta.url), "utf8");
const take = (name) => new RegExp("export const " + name + " = `([^`]*)`").exec(source)?.[1];
const CLAIM = take("CLAIM_ONCE_SQL"), RATE = take("RATE_HIT_SQL"), SWEEP = take("SWEEP_SQL");
if (!CLAIM || !RATE || !SWEEP) throw new Error("could not read the shared store statements");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const failures = [];
const check = (name, ok) => { console.log((ok ? "ok   " : "FAIL ") + name); if (!ok) failures.push(name); };
try {
  const run = (text, params) => client.query(text, params);
  await run("DELETE FROM security_shared_store WHERE key LIKE 'acc:%'");

  check("first claim wins", (await run(CLAIM, ["acc:claim-1", 60])).rowCount === 1);
  check("second claim of the same key is a duplicate", (await run(CLAIM, ["acc:claim-1", 60])).rowCount === 0);
  check("a different key is independent", (await run(CLAIM, ["acc:claim-2", 60])).rowCount === 1);
  await run("UPDATE security_shared_store SET expires_at = now() - interval '1 second' WHERE key = 'acc:claim-1'");
  check("an expired claim can be taken again", (await run(CLAIM, ["acc:claim-1", 60])).rowCount === 1);

  const counts = [];
  for (let i = 0; i < 4; i += 1) counts.push((await run(RATE, ["acc:rate-1", 60000])).rows[0].count);
  check("rate counter increments within a window", counts.join(",") === "1,2,3,4");
  await run("UPDATE security_shared_store SET window_start = now() - interval '2 minutes' WHERE key = 'acc:rate-1'");
  check("rate counter resets after the window", (await run(RATE, ["acc:rate-1", 60000])).rows[0].count === 1);

  const parallel = await Promise.all(Array.from({ length: 20 }, () => run(RATE, ["acc:rate-2", 60000])));
  const seen = parallel.map((r) => r.rows[0].count).sort((a, b) => a - b);
  check("20 concurrent hits count exactly 1..20 (atomic)", seen.join(",") === Array.from({ length: 20 }, (_, i) => i + 1).join(","));
  const claims = await Promise.all(Array.from({ length: 20 }, () => run(CLAIM, ["acc:claim-3", 60])));
  check("20 concurrent claims: exactly one winner", claims.filter((r) => r.rowCount === 1).length === 1);

  await run("UPDATE security_shared_store SET expires_at = now() - interval '1 hour' WHERE key LIKE 'acc:%'");
  await run(SWEEP);
  check("sweep removes long-expired rows", (await run("SELECT 1 FROM security_shared_store WHERE key LIKE 'acc:%'")).rowCount === 0);
} finally {
  await client.query("DELETE FROM security_shared_store WHERE key LIKE 'acc:%'").catch(() => {});
  await client.end();
}
if (failures.length) { console.error(`\n${failures.length} check(s) failed: ${failures.join("; ")}`); process.exit(1); }
console.log("\nshared store acceptance passed");
