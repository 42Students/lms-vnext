#!/usr/bin/env node
/**
 * Refuse committed credential artifact *paths* independently of token entropy.
 * No filenames, file contents, or Git errors are written to CI output.
 * This complements Gitleaks; it is not a credential-content scanner.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SAFE_EXAMPLE = new Set([".env.example"]);
const SENSITIVE_BASENAMES = new Set([
  ".npmrc", ".pypirc", ".netrc", ".pgpass",
  "credentials.json", "secrets.json", "application_default_credentials.json",
  "kubeconfig", "terraform.tfstate", "terraform.tfstate.backup",
  "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519",
]);
const SENSITIVE_DIRS = new Set([".aws", ".ssh", ".kube"]);
const SECRET_EXTENSIONS = /\.(?:pem|p12|pfx|jks|keystore|keytab|key|kubeconfig|tfstate(?:\..+)?|tfvars(?:\.json)?)$/i;

export function isCredentialArtifactPath(path) {
  if (typeof path !== "string" || path.length === 0) return false;
  const parts = path.replaceAll("\\", "/").toLowerCase().split("/");
  const basename = parts.at(-1);
  if (SAFE_EXAMPLE.has(basename)) return false;
  if (parts.some((part) => SENSITIVE_DIRS.has(part))) return true;
  if (parts.some((part, i) => part === ".config" && parts[i + 1] === "gcloud")) return true;
  if (/^\.env(?:\..+)?$/.test(basename)) return true;
  if (SENSITIVE_BASENAMES.has(basename)) return true;
  if (SECRET_EXTENSIONS.test(basename)) return true;
  if (/(?:^|[_-])(?:service[_-]?account|credentials?)(?:[_-][a-z0-9.-]*)?\.json$/.test(basename)) return true;
  if (/(?:^|[_-])(?:private[_-]?key|client[_-]?secret)(?:[_-].*)?\.json$/.test(basename)) return true;
  return false;
}

function git(args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function parseNullPaths(text) {
  return text.split("\0").map((item) => item.replace(/^\n+/, "")).filter(Boolean);
}

export function checkRepository({ range = null } = {}) {
  const tracked = parseNullPaths(git(["ls-files", "--cached", "-z"]));
  // Detect transient files introduced and removed in separate commits of one
  // proposed change. They remain recoverable in Git history after deletion.
  const changed = range
    ? parseNullPaths(git(["log", "--format=", "--name-only", "-z", "--diff-filter=ACMRT", range]))
    : [];
  const blocked = new Set([...tracked, ...changed].filter(isCredentialArtifactPath));
  return { trackedPaths: tracked.length, historicalPaths: changed.length, blocked: blocked.size };
}

export function main(args = []) {
  if (args.length !== 0 && (args.length !== 2 || args[0] !== "--range" ||
       !/^[a-f0-9]{40}\.\.(?:HEAD|[a-f0-9]{40})$/.test(args[1]))) {
    throw new Error("Invalid Git revision range");
  }
  const summary = checkRepository({ range: args.length ? args[1] : null });
  // This does not disclose blocked paths or secret-like source bytes.
  process.stdout.write(JSON.stringify({ event: "security.credential_artifact_path_gate", ...summary }) + "\n");
  if (summary.blocked) {
    process.stderr.write("::error::Credential artifact path detected in tracked files or added commit history. Investigate privately; do not print its contents.\n");
    return 1;
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    process.stderr.write("::error::Credential artifact path inspection could not complete; failing closed.\n");
    process.exitCode = 2;
  }
}
