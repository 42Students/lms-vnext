import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { summarizeFindings, validateRedactedBaseline } from "../scripts/security/gitleaks-report-gate.mjs";

const cli = fileURLToPath(new URL("../scripts/security/gitleaks-report-gate.mjs", import.meta.url));

test("empty scan report has zero findings", () => {
  assert.deepEqual(summarizeFindings([]), { findings: 0, byRule: {} });
});

test("summary never contains secret, path or fingerprint values", () => {
  const secret = "NOT_A_REAL_SECRET_FOR_REGRESSION_ONLY";
  const summary = summarizeFindings([{ RuleID: "generic-api-key", Match: secret,
    Secret: secret, File: "private-credentials.env", Fingerprint: "private:identity" }]);
  assert.deepEqual(summary, { findings: 1, byRule: { "generic-api-key": 1 } });
  assert.doesNotMatch(JSON.stringify(summary), /NOT_A_REAL_SECRET|private-credentials|private:identity/);
});

test("untrusted rule ID cannot inject control sequences into output", () => {
  const summary = summarizeFindings([{ RuleID: "rule\n::warning::INJECT" }]);
  const key = Object.keys(summary.byRule)[0];
  assert.match(key, /^[a-zA-Z0-9_-]+$/);
  assert.doesNotMatch(key, /::|\n/);
});

test("baseline requires redaction and a fingerprint in every entry", () => {
  assert.equal(validateRedactedBaseline([{ Match: "REDACTED", Secret: "REDACTED",
    Fingerprint: "old:fingerprint" }]), 1);
  assert.throws(() => validateRedactedBaseline([{ Match: "REDACTED", Secret: "raw-value",
    Fingerprint: "old:fingerprint" }]));
  assert.throws(() => validateRedactedBaseline([{ Match: "REDACTED", Secret: "REDACTED",
    Fingerprint: "" }]));
});

test("invalid report format fails closed", () => {
  assert.throws(() => summarizeFindings(null));
  assert.throws(() => summarizeFindings([{ RuleID: null }]));
  assert.throws(() => validateRedactedBaseline({}));
});

test("CLI enforces findings and reports errors without echoing candidate values", () => {
  const dir = mkdtempSync(join(tmpdir(), "vnext-gitleaks-gate-"));
  try {
    const file = join(dir, "findings.json");
    const secret = "NOT_A_REAL_SECRET_FOR_REGRESSION_ONLY";
    writeFileSync(file, JSON.stringify([{ RuleID: "generic-api-key",
      Match: secret, Secret: secret, File: "private-credentials.env" }]));
    const run = () => spawnSync(process.execPath, [cli, "--fail-on-findings", file],
      { encoding: "utf8" });
    const fail = run();
    assert.equal(fail.status, 1);
    assert.doesNotMatch(fail.stdout + fail.stderr, /NOT_A_REAL_SECRET|private-credentials/);
    writeFileSync(file, "[]");
    assert.equal(run().status, 0);
    writeFileSync(file, "invalid-json");
    const invalid = run();
    assert.equal(invalid.status, 2);
    assert.doesNotMatch(invalid.stderr, /invalid-json/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
