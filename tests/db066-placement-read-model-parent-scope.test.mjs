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
    const joins = [...source.matchAll(/\\.innerJoin\\(\\s*placementJobRoleOptions,/g)];
    assert.ok(joins.length >= 3, "Expected existing role-option read paths");
    for (const match of joins) {
      const scope = source.slice(match.index, match.index + 470);
      assert.match(scope, /and\\(/, "Role read must use a compound join");
      assert.match(
        scope,
        /eq\\(placementJobRoleOptions\\.id, placementApplications\\.roleOptionId\\)/,
      );
      assert.match(
        scope,
        /eq\\(placementJobRoleOptions\\.jobId, placementApplications\\.jobId\\)/,
        "A valid role ID from an unrelated job must not be exposed",
      );
    }
  });
}
