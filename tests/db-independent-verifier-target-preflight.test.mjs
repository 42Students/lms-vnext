import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const verifierSource = readFileSync("scripts/db-independent-verify.mjs", "utf8");

function rejectedBeforeConnecting(name, urls, refusal, secret) {
  const directory = mkdtempSync(join(tmpdir(), "lms-vnext-db-verifier-preflight-"));
  const evidencePath = join(directory, "evidence.json");
  try {
    const run = spawnSync(process.execPath, ["scripts/db-independent-verify.mjs"], {
      encoding: "utf8",
      env: {
        ...process.env,
        TEST_DATABASE_URL: urls.test,
        DATABASE_URL: urls.app ?? "",
        DB01_REMOTE_TEST_DATABASE_CONFIRM: "",
        DB_VERIFY_EVIDENCE_PATH: evidencePath,
      },
    });
    const output = (run.stdout ?? "") + "\n" + (run.stderr ?? "");
    assert.notEqual(run.status, 0, name + ": unsafe verification must refuse");
    assert.match(output, refusal, name + ": refusal must explain the guard");
    assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|connection refused|ERR_MODULE_NOT_FOUND/i,
      name + ": no PostgreSQL/network access before target approval");
    assert.doesNotMatch(output, new RegExp(secret), name + ": credentials must not leak");
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    assert.equal(evidence.passed, false);
    assert.deepEqual(evidence.steps, []);
    assert.doesNotMatch(JSON.stringify(evidence), new RegExp(secret));
    return evidence;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("DB001 supplied database is guarded before the read-only version probe", () => {
  const preflight = verifierSource.indexOf("assertSafeDb01TestTarget({");
  const probe = verifierSource.indexOf("postgresVersion: providedPostgresVersion(env)");
  assert.ok(preflight >= 0 && probe > preflight,
    "verifier must preflight untrusted supplied URLs before any PG connection");
  assert.match(verifierSource, /import\s*\{\s*assertSafeDb01TestTarget\s*\}/);
});

test("DB001 rejects a supplied test URL aliasing the application DB under a different loopback host", () => {
  rejectedBeforeConnecting("app-alias", {
    test: "postgresql://test:secretAliasXYZ@127.0.0.1:5432/lms_vnext_test",
    app: "postgresql://app:other@localhost/lms_vnext_test",
  }, /Refusing to reset the configured application database/, "secretAliasXYZ");
});

test("DB001 rejects an unconfirmed remote disposable DB before opening a pool", () => {
  rejectedBeforeConnecting("remote-target", {
    test: "postgresql://tester:secretRemoteXYZ@pg.internal/lms_vnext_test",
  }, /Remote test database requires DB01_REMOTE_TEST_DATABASE_CONFIRM/, "secretRemoteXYZ");
});

test("DB001 refuses malformed URLs and redacts them in its evidence", () => {
  const evidence = rejectedBeforeConnecting("malformed-url", {
    test: "not-a-postgres-url-secretMalformedXYZ",
  }, /not a valid PostgreSQL URL/, "secretMalformedXYZ");
  assert.equal(evidence.databaseUrlRedacted, "<invalid PostgreSQL URL>");
});
