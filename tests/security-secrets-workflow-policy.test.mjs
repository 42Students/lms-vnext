import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const incremental = read(".github/workflows/security-new-commit-secrets.yml");
const historical = read(".github/workflows/security-full-history-secrets.yml");
const config = read(".gitleaks.toml");

test("provider rules extend built-in signatures without any blanket allowlist", () => {
  assert.match(config, /useDefault\s*=\s*true/);
  assert.match(config, /42learn-provider-api-credential/);
  assert.match(config, /secretGroup\s*=\s*1/);
  assert.doesNotMatch(config, /^\s*\[\[?allowlists?\]?\]/m);
  assert.match(incremental, /--config=\.gitleaks\.toml/);
  assert.match(historical, /--config=\.gitleaks\.toml/);
});


test("new-commit scanner runs on every PR and main push, without path filters", () => {
  assert.match(incremental, /^on:\s*$/m);
  assert.match(incremental, /^  pull_request:\s*$/m);
  assert.match(incremental, /^  push:\s*$/m);
  assert.match(incremental, /^    branches:\s*\[main\]/m);
  assert.doesNotMatch(incremental, /^\s+paths(?:-ignore)?:/m);
  assert.match(incremental, /^permissions:\s*\n  contents: read/m);
  assert.doesNotMatch(incremental, /^\s+contents: write/m);
});

test("incremental scan never suppresses newly committed secrets using historical baseline", () => {
  assert.match(incremental, /gitleaks.*v8\.30\.1/);
  assert.match(incremental, /--log-opts="\$range"/);
  assert.match(incremental, /--redact/);
  assert.doesNotMatch(incremental, /--baseline-path/);
  assert.match(incremental, /--fail-on-findings "\$report"/);
  assert.match(incremental, /--validate-baseline \.gitleaks-baseline\.json/);
  assert.match(incremental, /persist-credentials: false/);
});

test("full history scan recurs weekly and fails closed on scanner reports", () => {
  assert.match(historical, /^  schedule:\s*$/m);
  assert.match(historical, /cron:/);
  assert.match(historical, /gitleaks.*v8\.30\.1/);
  assert.match(historical, /--log-opts='--all'/);
  assert.match(historical, /--redact/);
  assert.match(historical, /--fail-on-findings "\$report"/);
  assert.match(historical, /--validate-baseline \.gitleaks-baseline\.json/);
  assert.doesNotMatch(historical, /print\(.*Secret|echo.*Secret/);
});

test("checked-in historical baseline cannot store raw candidate values", () => {
  const baseline = JSON.parse(read(".gitleaks-baseline.json"));
  assert.ok(Array.isArray(baseline));
  for (const finding of baseline) {
    assert.equal(finding.Secret, "REDACTED");
    assert.equal(finding.Match, "REDACTED");
    if (finding.Line !== undefined) assert.equal(finding.Line, "REDACTED");
    assert.ok(finding.Fingerprint);
  }
});
