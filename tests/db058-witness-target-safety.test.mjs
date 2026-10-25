import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assertDb018DisposableTarget } from "./support/db018-test-target.mjs";

const local = "postgresql://tester:example-secret@127.0.0.1:5432/lms_vnext_test_4242";
const isolated = { TEST_DATABASE_URL: local, DB018_ISOLATED_TEST_DATABASE: "1" };
const verifier = {
  TEST_DATABASE_URL: local,
  DATABASE_URL: local,
  DB03_ISOLATED_TEST_DATABASE: "1",
};
const remote = "postgresql://tester:remote-secret@pg.internal/lms_vnext_test_4242";

test("DB058 allows explicitly isolated local TEST_DATABASE_URL only", () => {
  assert.deepEqual(assertDb018DisposableTarget(isolated), {
    host: "127.0.0.1",
    database: "lms_vnext_test_4242",
    mode: "local",
  });
});
test("DB058 denies a URL without an isolated flag", () => {
  assert.throws(() => assertDb018DisposableTarget({ TEST_DATABASE_URL: local }),
    /isolation flag required/);
});
test("DB058 denies an isolation flag without TEST_DATABASE_URL", () => {
  assert.throws(() => assertDb018DisposableTarget({ DB018_ISOLATED_TEST_DATABASE: "1" }),
    /TEST_DATABASE_URL/);
});
test("DB058 refuses production names even with an isolated flag", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated,
    TEST_DATABASE_URL: "postgresql://tester:secret@localhost/lms_prod",
  }), /not explicitly a test database/);
});
test("DB058 refuses wrong URL protocol before connecting", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated,
    TEST_DATABASE_URL: "https://localhost/lms_vnext_test_4242",
  }), /PostgreSQL URL/);
});
test("DB058 refuses unconfirmed remote hosts before connecting", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated, TEST_DATABASE_URL: remote,
  }), /Remote test database requires/);
});
test("DB058 refuses stale remote confirmation", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated, TEST_DATABASE_URL: remote,
    DB01_REMOTE_TEST_DATABASE_CONFIRM: "RESET:other.internal/lms_vnext_test_4242",
  }), /Remote test database requires/);
});
test("DB058 only allows a precisely confirmed remote disposable target", () => {
  assert.deepEqual(assertDb018DisposableTarget({
    ...isolated, TEST_DATABASE_URL: remote,
    DB01_REMOTE_TEST_DATABASE_CONFIRM: "RESET:pg.internal/lms_vnext_test_4242",
  }), { host: "pg.internal", database: "lms_vnext_test_4242", mode: "explicit-remote" });
});
test("DB058 refuses alias to application database with manually set witness flag", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated, DATABASE_URL: local,
  }), /application database alias requires independent verifier/);
});
test("DB058 allows exact safe alias only when independent verifier flag is supplied", () => {
  assert.deepEqual(assertDb018DisposableTarget(verifier, { serviceBound: true }), {
    host: "127.0.0.1",
    database: "lms_vnext_test_4242",
    mode: "local",
  });
});
test("DB058 service-backed tests refuse unbound application URL", () => {
  assert.throws(() => assertDb018DisposableTarget(isolated, { serviceBound: true }),
    /must equal TEST_DATABASE_URL/);
});
test("DB058 service-backed tests refuse a different application database", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...verifier,
    DATABASE_URL: "postgresql://tester:secret@127.0.0.1:5432/lms_production",
  }, { serviceBound: true }), /must equal TEST_DATABASE_URL/);
});
test("DB058 canonical guard compares application and test target despite different credentials", () => {
  assert.throws(() => assertDb018DisposableTarget({
    ...isolated,
    DATABASE_URL: "postgresql://someone:else@127.0.0.1:5432/lms_vnext_test_4242",
  }), /configured application database/);
});
test("DB058 never includes a password in refusal messages", () => {
  let message = "";
  try {
    assertDb018DisposableTarget({
      ...isolated, TEST_DATABASE_URL: "postgresql://tester:verySensitivePassword@pg.internal/lms_vnext_test_4242",
    });
  } catch (error) {
    message = error.message;
  }
  assert.match(message, /Remote test database requires/);
  assert.doesNotMatch(message, /verySensitivePassword/);
});
test("DB058 all five DB18 integration suites preflight before Pool construction", () => {
  const names = [
    "db018-relational-and-boundary-witnesses",
    "db18-registered-negative-witnesses",
    "db18-concurrency-witnesses",
    "db18-known-race-gaps",
    "db18-placement-race-gap",
  ];
  for (const name of names) {
    const source = readFileSync(`tests/integration/${name}.test.ts`, "utf8");
    const importAt = source.indexOf('from "../support/db018-test-target.mjs"');
    const preflightAt = source.indexOf("assertDb018DisposableTarget(process.env");
    const poolAt = source.indexOf("new Pool(");
    assert.ok(importAt >= 0, name + " must import the shared guard");
    assert.ok(preflightAt > importAt, name + " must actually use the guard");
    assert.ok(poolAt > preflightAt, name + " must preflight before creating a DB pool");
    assert.doesNotMatch(source, /process\.env\.TEST_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/);
    if (name.includes("race-gap")) assert.match(source, /serviceBound: true/);
  }
});


test("DB004 concurrent write witnesses validate the disposable target before creating Pool", () => {
  const source = readFileSync(
    "tests/integration/db01-concurrent-integrity.test.ts", "utf8",
  );
  const imported = source.indexOf('from "../support/db018-test-target.mjs"');
  const preflight = source.indexOf("assertDb018DisposableTarget(process.env)");
  const connection = source.indexOf("new Pool(");
  assert.ok(imported >= 0, "DB01 must import the shared no-connect preflight");
  assert.ok(preflight > imported && connection > preflight,
    "DB01 must preflight before creating any PG connection");
  assert.doesNotMatch(source, /TEST_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/);
});

test("DB030 assessment acceptance witnesses validate the target before creating Pool", () => {
  const source = readFileSync(
    "tests/integration/db06-assessment-parent-scope.test.ts", "utf8",
  );
  const imported = source.indexOf('from "../support/db018-test-target.mjs"');
  const preflight = source.indexOf("assertDb018DisposableTarget({");
  const connection = source.indexOf("new Pool(");
  assert.ok(imported >= 0, "DB06 must import the shared no-connect preflight");
  assert.ok(preflight > imported && connection > preflight,
    "DB06 must preflight before creating any PG connection");
  assert.match(source, /DB06_ISOLATED_TEST_DATABASE===["']1["']/);
});

test("DB030 negative witness helpers accept independent learner identities", () => {
  const source = readFileSync(
    "tests/integration/db06-assessment-parent-scope.test.ts", "utf8",
  );
  assert.match(source,
    /async function attempt\(db:Sql,q:string,d:string,m:string=ownedLearnerMembership\)/);
  assert.match(source,
    /async function submission\(db:Sql,a:string,d:string,m:string=ownedLearnerMembership\)/);
});


test("DB10 log-alert integration never uses the app URL as a test-target fallback", () => {
  const source = readFileSync(
    "tests/integration/db10-log-alert-admin.test.ts", "utf8",
  );
  const importAt = source.indexOf('from "../support/db018-test-target.mjs"');
  const testOnly = source.indexOf("const databaseUrl = process.env.TEST_DATABASE_URL;");
  const optIn = source.indexOf('process.env.DB10_DISPOSABLE_TEST_DATABASE !== "true"');
  const bound = source.indexOf("process.env.DATABASE_URL !== databaseUrl");
  const preflight = source.indexOf("assertDb018DisposableTarget(process.env, { serviceBound: true })");
  const poolAt = source.indexOf("new Pool(");
  assert.ok(importAt >= 0 && testOnly > importAt && optIn > testOnly,
    "DB10 must require explicit TEST_DATABASE_URL and DB10 opt-in");
  assert.ok(bound > optIn && preflight > bound && poolAt > preflight,
    "DB10 must verify service target and preflight before opening a pool");
  assert.doesNotMatch(source, /TEST_DATABASE_URL\s*\?\?\s*process\.env\.DATABASE_URL/);
});
