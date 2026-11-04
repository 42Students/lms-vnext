import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

const requiredPatterns = [
  "**/.env*", "**/.aws/**", "**/.ssh/**", "**/.kube/**",
  "**/.config/gcloud/**", "**/*.pem", "**/*.p12", "**/*.pfx",
  "**/*.jks", "**/*.keystore", "**/*.keytab", "**/*.key",
  "**/*.tfstate*", "**/*.tfvars", "**/*.tfvars.json",
  "**/*service-account*.json", "**/*service_account*.json",
  "**/*credentials*.json", "**/*client_secret*.json", "**/secrets.json",
  "**/.npmrc", "**/.pypirc", "**/.netrc", "**/.pgpass",
  "**/id_rsa", "**/id_dsa", "**/id_ecdsa", "**/id_ed25519",
  "**/application_default_credentials.json",
];

for (const file of [".dockerignore", ".gcloudignore"]) {
  test(file + " excludes high-risk local credentials from build uploads", () => {
    const text = read(file);
    const lines = new Set(text.split(/\r?\n/).map((line) => line.trim()));
    assert.ok(lines.has(".git"), "Git history must not enter a cloud build context");
    for (const pattern of requiredPatterns) {
      assert.ok(lines.has(pattern), "Missing credential exclusion in " + file + ": " + pattern);
    }
    // A later negated pattern would defeat the conservative exclusions.
    assert.doesNotMatch(text, /^!(?:\*\*\/)?(?:\.env|\.aws|\.ssh|\.kube|.*(?:\.key|\.pem|credentials\.json))[\s\S]*$/m);
  });
}

test(".env.example is the only Git-tracked .env family exception", () => {
  const lines = read(".gitignore").split(/\r?\n/).map((line) => line.trim());
  assert.ok(lines.includes(".env"));
  assert.ok(lines.includes(".env.*"));
  const exceptions = lines.filter((line) => line.startsWith("!") && line.includes(".env"));
  assert.deepEqual(exceptions, ["!.env.example"]);
});
test(".gitignore prevents accidental staging of sensitive identity files", () => {
  const lines = new Set(read(".gitignore").split(/\r?\n/).map((line) => line.trim()));
  for (const pattern of [
    "**/.aws/", "**/.ssh/", "**/.kube/", "**/.config/gcloud/",
    "**/.npmrc", "**/.netrc", "**/id_rsa", "**/id_ed25519",
    "**/*.pem", "**/*.p12", "**/*.pfx", "**/*.keystore",
    "**/*.key", "**/*.tfstate*", "**/*.tfvars",
    "**/*service-account*.json", "**/*service_account*.json",
    "**/*credentials*.json", "**/secrets.json",
  ]) {
    assert.ok(lines.has(pattern), "Git staging guard missing credential exclusion: " + pattern);
  }
});
