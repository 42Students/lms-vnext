import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isCredentialArtifactPath } from "../scripts/security/credential-artifact-gate.mjs";

const script = fileURLToPath(new URL("../scripts/security/credential-artifact-gate.mjs", import.meta.url));

test("rejects high-confidence private credential files in nested directories", () => {
  for (const path of [
    ".env", "apps/api/.env.production.local", ".aws/credentials",
    "home/.config/gcloud/application_default_credentials.json",
    "private/.ssh/id_ed25519", "secrets/production-service-account.json",
    "secrets/service_account.json", "src/credentials.json", "token/SECRETS.json",
    "deploy/server.key", "deploy/cluster.kubeconfig", "terraform/terraform.tfstate",
    "deploy/prod.tfvars.json", "certs/tls.p12", "cloud/GCP-credentials.json",
    "auth/google_client_secret.json", "enterprise/admin.keystore",
  ]) {
    assert.equal(isCredentialArtifactPath(path), true, "Missed unsafe credential artifact: " + path);
  }
});

test("allows safe, noncredential source artifacts", () => {
  for (const path of [
    ".env.example", "README.md", "src/lib/firebase-config.ts",
    "tests/fixtures/mock-api-key.txt", "docs/architecture/secrets-overview.md",
    "public/favicon.ico", "certs/ca-public.crt", "configs/app.json",
  ]) assert.equal(isCredentialArtifactPath(path), false, path);
});

test("checks introduced-then-deleted sensitive files in all commits of a range", () => {
  const dir = mkdtempSync(join(tmpdir(), "credential-artifact-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  try {
    git("init", "-q");
    git("config", "user.name", "Unit Test");
    git("config", "user.email", "test@example.invalid");
    writeFileSync(join(dir, "README.md"), "fixture");
    git("add", ".");
    git("commit", "-qm", "initial");
    const base = git("rev-parse", "HEAD");
    const marker = "synthetic-private-value-not-an-actual-key";
    writeFileSync(join(dir, "credentials.json"), marker);
    git("add", ".");
    git("commit", "-qm", "introduce synthetic example");
    unlinkSync(join(dir, "credentials.json"));
    git("add", "-A");
    git("commit", "-qm", "remove synthetic example");

    const current = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    assert.equal(current.status, 0, "HEAD should contain only a benign file");
    const historic = spawnSync(process.execPath, [script, "--range", base + "..HEAD"], { cwd: dir, encoding: "utf8" });
    assert.equal(historic.status, 1, "Added and then deleted key artifacts must still block");
    assert.match(historic.stderr, /Credential artifact path detected/);
    assert.doesNotMatch(historic.stdout + historic.stderr, /credentials\.json|synthetic-private-value-not-an-actual-key/);
    const summary = JSON.parse(historic.stdout);
    assert.equal(summary.blocked, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("malformed revision ranges fail closed without exposing input", () => {
  const result = spawnSync(process.execPath, [script, "--range", "evil;something"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.doesNotMatch(result.stderr, /evil;something/);
});
