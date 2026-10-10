import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("scheduled-job lease draft remains outside the shared schema barrel", () => {
  const barrel = fs.readFileSync("src/db/schema/index.ts", "utf8");
  assert.doesNotMatch(barrel, /db10-scheduled-job-leases\.draft/);
});

test("Postgres lease acquisition is atomic, fenced and database-clock based", () => {
  const code = fs.readFileSync(
    "src/modules/operations/postgres-scheduled-job-lease-store.ts",
    "utf8",
  );
  assert.match(code, /insert into scheduled_job_leases/);
  assert.match(code, /on conflict \(job_name\) do update/);
  assert.match(code, /where scheduled_job_leases\.locked_until <= clock_timestamp\(\)/);
  assert.match(code, /fence = scheduled_job_leases\.fence \+ 1/);
  assert.match(code, /and fence = \$\{lease\.fence\}/);
  assert.match(code, /and locked_until > clock_timestamp\(\)/);
  assert.doesNotMatch(code, /release\s*\(/);
});
