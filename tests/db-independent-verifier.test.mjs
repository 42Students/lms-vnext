import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

test("DB078 independent witness runs after registered PG replay using isolated environment", () => {
  const migration = script.indexOf('"db:migrate"');
  const catalog = script.indexOf('"scripts/db002-postgres-catalog-acceptance.mjs"');
  const witness = script.indexOf('"tests/db078-registered-course-column-disposition-pg.test.mjs"');
  const sourceContracts = script.indexOf('"test:db:parity"');
  assert.ok(migration !== -1 && catalog > migration);
  assert.ok(witness > catalog && sourceContracts > witness);
  assert.match(
    script.slice(witness, witness + 180),
    /DB078_DISPOSABLE:\s*"1"/,
  );
  assert.match(
    script.slice(witness, witness + 180),
    /destructiveEnv/,
  );
  assert.match(script, /results\.length === 12/);
});

test("DB078 PostgreSQL witness preserves application URL during alias preflight", () => {
  const witness = fs.readFileSync(
    path.join(root, "tests/db078-registered-course-column-disposition-pg.test.mjs"),
    "utf8",
  );
  assert.match(witness, /assertSafeDb01TestTarget\(process\.env\)/);
  assert.doesNotMatch(
    witness,
    /assertSafeDb01TestTarget\(\{[^}]*DATABASE_URL:\s*["']["']/,
  );
  const preflight = witness.indexOf("assertSafeDb01TestTarget(process.env)");
  const connect = witness.indexOf("new pg.Pool(");
  assert.ok(preflight > 0 && connect > preflight);
});

test("DB078 witness refuses an aliased application DB before any connection", () => {
  const secret = "db078AliasFixtureSecret";
  const result = spawnSync(process.execPath,
    ["--test", "tests/db078-registered-course-column-disposition-pg.test.mjs"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        DB078_DISPOSABLE: "1",
        TEST_DATABASE_URL: "postgresql://test:password@127.0.0.1:1/lms_vnext_test",
        DATABASE_URL: "postgresql://app:" + secret + "@localhost:1/lms_vnext_test",
      },
    });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  assert.notEqual(result.status, 0);
  assert.match(output, /Refusing to reset the configured application database/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused/i);
  assert.doesNotMatch(output, new RegExp(secret));
});
import "./db-independent-verifier-redaction.test.mjs";

test("L08 registered DB09 witnesses are sequenced after PostgreSQL replay and catalog", () => {
  const catalog=script.indexOf('"scripts/db002-postgres-catalog-acceptance.mjs"');
  const crm=script.indexOf('"tests/db09-collaboration-registered-pg-acceptance.mjs"');
  const sharing=script.indexOf('"tests/db09-share-registered-pg-acceptance.mjs"');
  const parity=script.indexOf('"test:db:parity"');
  assert.ok(catalog>=0 && crm>catalog && sharing>crm && parity>sharing);
  for(const i of [crm,sharing]){
    const spec=script.slice(i,i+180);
    assert.match(spec,/destructiveEnv/);
    assert.match(spec,/DB09_ISOLATED_TEST_DATABASE/);
  }
});

test("both DB09 witnesses require an isolated database and rollback-only writes", () => {
  for(const file of ["db09-collaboration-registered-pg-acceptance.mjs","db09-share-registered-pg-acceptance.mjs"]){
    const witness=fs.readFileSync(path.join(root,"tests",file),"utf8");
    assert.match(witness,/assertDb018DisposableTarget/);
    assert.match(witness,/DB09_ISOLATED_TEST_DATABASE/);
    assert.match(witness,/TEST_DATABASE_URL/);
    assert.match(witness,/ROLLBACK/);
  }
});
