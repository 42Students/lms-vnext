import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const script = fs.readFileSync(
  path.join(root, "scripts/db-independent-verify.mjs"),
  "utf8",
);
const pkg = JSON.parse(
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
);

test("independent DB verifier is wired without GitHub Actions", () => {
  assert.equal(
    pkg.scripts["db:verify:independent"],
    "node scripts/db-independent-verify.mjs",
  );
  assert.match(script, /postgres:17-alpine/);
  assert.match(script, /TEST_DATABASE_URL/);
  assert.match(script, /githubActionsUsed:\s*false/);
  assert.doesNotMatch(script, /gh\s+workflow|actions\/runs|rerun.*workflow/i);
});

test("independent DB verifier runs required DB gates", () => {
  for (const command of [
    "db:journal:verify",
    "db:test:prepare",
    "db:migrate",
    "test:db:parity",
    "test:db",
  ]) {
    assert.ok(script.includes(command), `missing ${command}`);
  }
  assert.match(script, /DB03_ISOLATED_TEST_DATABASE/);
});

test("independent DB verifier records exact evidence and cleans Docker", () => {
  assert.match(script, /git", \["rev-parse", "HEAD"\]/);
  assert.match(script, /outputSha256/);
  assert.match(script, /exitCode/);
  assert.match(script, /postgresVersion/);
  assert.match(script, /docker", \["rm", "--force"/);
  assert.match(script, /writeFileSync\(evidencePath/);
});

// Run fail-closed supplied-target witnesses inside the registered DB parity suite.
import "./db-independent-verifier-target-preflight.test.mjs";
