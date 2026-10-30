import assert from "node:assert/strict";
import test from "node:test";
import { redactVerifierOutput } from "../scripts/db-independent-verifier-redaction.mjs";

test("DB001 verifier receipt redacts configured credentials without losing error context", () => {
  const url = "postgresql://tester:sensitiveOne@db.internal:5432/lms_vnext_test";
  const output = redactVerifierOutput(
    `failed command at ${url}; another token sensitiveTwo; retry on db.internal`,
    { TEST_DATABASE_URL: url, DB_PASSWORD: "sensitiveTwo" },
  );
  assert.match(output, /failed command/);
  assert.match(output, /retry on db.internal/);
  assert.doesNotMatch(output, /sensitiveOne|sensitiveTwo|tester/);
});

test("DB001 verifier redacts PostgreSQL URL userinfo even for a subprocess-only URL", () => {
  const output = redactVerifierOutput(
    "pg error at postgres://unexpected:topsecret@127.0.0.1:5432/test_db",
    {},
  );
  assert.match(output, /postgres:\/\/\[REDACTED\]@127\.0\.0\.1:5432\/test_db/);
  assert.doesNotMatch(output, /unexpected|topsecret/);
});

test("DB001 verifier redacts Docker-generated password arguments", () => {
  const output = redactVerifierOutput(
    "docker run --env POSTGRES_PASSWORD=ephemeral-123 --name disposable failed",
    {},
  );
  assert.match(output, /POSTGRES_PASSWORD=\[REDACTED\]/);
  assert.doesNotMatch(output, /ephemeral-123/);
});

test("DB001 verifier does not mutate ordinary clean output", () => {
  const summary = "9 gates PASS; postgres 17; schema drift clean";
  assert.equal(redactVerifierOutput(summary, {}), summary);
});

test("DB001 verifier redacts query and fragment secrets in subprocess URLs", () => {
  const output = redactVerifierOutput(
    "failed at postgresql://worker:privatePassword@pg.internal:5432/lms_vnext_test?password=hiddenQueryPassword&sslkey=privateKey#hiddenFragment", {},
  );
  assert.match(output, /pg\.internal:5432\/lms_vnext_test/);
  for (const secret of ["worker", "privatePassword", "hiddenQueryPassword", "privateKey", "hiddenFragment"]) {
    assert.doesNotMatch(output, new RegExp(secret));
  }
  assert.match(output, /\?\[REDACTED\]/);
  assert.match(output, /#\[REDACTED\]/);
});


test("DB001 verifier redacts libpq keyword DSNs and standalone child credentials", () => {
  const output = redactVerifierOutput(
    "psql connect failed: host=pg.internal dbname=lms_vnext_test password=childOnlySecret sslpassword=clientKeyPassword; retry",
    {},
  );
  assert.match(output, /host=pg\.internal dbname=lms_vnext_test/);
  assert.match(output, /password=\[REDACTED\]/);
  assert.match(output, /sslpassword=\[REDACTED\]/);
  assert.match(output, /retry/);
  assert.doesNotMatch(output, /childOnlySecret|clientKeyPassword/);
});

test("DB001 verifier redacts quoted, escaped and colon-separated passwords", () => {
  const output = redactVerifierOutput(
    "password='quoted secret with spaces'; sslpassword=\"another secret\"; password='escaped\\'quote secret'; error password: lastSecret",
    {},
  );
  assert.equal((output.match(/\[REDACTED\]/g) ?? []).length, 4);
  assert.doesNotMatch(output, /quoted secret|another secret|escaped|lastSecret/);
  assert.match(output, /error password: \[REDACTED\]/);
});

test("DB001 verifier redacts child process password environment assignments", () => {
  const output = redactVerifierOutput(
    "env: PGPASSWORD=exposedByChild POSTGRES_PASSWORD=\"docker leaked password\" DB_PASSWORD=anotherLeakedValue",
    {},
  );
  for (const name of ["PGPASSWORD", "POSTGRES_PASSWORD", "DB_PASSWORD"]) {
    assert.match(output, new RegExp(name + "=\\[REDACTED\\]"));
  }
  assert.doesNotMatch(output, /exposedByChild|docker leaked password|anotherLeakedValue/);
});

test("DB001 verifier redacts separately configured PGPASSWORD values even without a label", () => {
  const output = redactVerifierOutput("credential mismatch: alternateSecretValue", {
    PGPASSWORD: "alternateSecretValue",
  });
  assert.equal(output, "credential mismatch: [REDACTED]");
});

test("DB001 verifier keeps ordinary password-authentication errors readable", () => {
  const ordinary = "password authentication failed for user app; retry on pg.internal";
  assert.equal(redactVerifierOutput(ordinary, {}), ordinary);
});
