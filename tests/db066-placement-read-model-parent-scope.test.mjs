import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// DB-066 is not complete until its composite foreign keys are in the
// registered migration journal and tested against disposable PostgreSQL.
// Meanwhile, these reads must also fail closed on mismatched role/job rows.
for (const [label, path] of [
  ["application", "src/modules/placements/application-service.ts"],
  ["learner request", "src/modules/placements/request-service.ts"],
]) {
  test(`DB-066 ${label} reads never join a role option from another job`, () => {
    const source = readFileSync(path, "utf8");
    const joins = [...source.matchAll(/\.innerJoin\(\s*placementJobRoleOptions,/g)];
    assert.ok(joins.length >= 3, "Expected existing role-option read paths");
    for (const match of joins) {
      const scope = source.slice(match.index, match.index + 470);
      assert.match(scope, /and\(/, "Role read must use a compound join");
      assert.match(
        scope,
        /eq\(placementJobRoleOptions\.id, placementApplications\.roleOptionId\)/,
      );
      assert.match(
        scope,
        /eq\(placementJobRoleOptions\.jobId, placementApplications\.jobId\)/,
        "A valid role ID from an unrelated job must not be exposed",
      );
    }
  });
}

test("DB-066 request reads reject a round from another job or offer from another application", () => {
  const source = readFileSync("src/modules/placements/request-service.ts", "utf8");
  const start = source.indexOf("async function loadRequestContext(");
  const end = source.indexOf("function scopeKeyFor(", start);
  assert.ok(start >= 0 && end > start);
  const read = source.slice(start, end);
  assert.match(read, /\.leftJoin\(\s*placementJobRounds,/);
  assert.match(read, /\.leftJoin\(\s*placementOffers,/);
  assert.match(read, /row\.request\.roundId !== null && row\.roundJobId !== row\.job\.id/);
  assert.match(read, /row\.request\.offerId !== null &&\s*row\.offerApplicationId !== row\.application\.id/);
  assert.match(read, /"PLACEMENT_REQUEST_NOT_FOUND"/);
});
