#!/usr/bin/env node
/**
 * Gitleaks CI result gate. Raw findings never enter Actions logs or artifacts.
 * Known historical findings are NOT proof that their underlying credentials
 * are safe: rotation, investigation and history remediation are separate work.
 */
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function validateRedactedBaseline(findings) {
  if (!Array.isArray(findings)) throw new Error("Invalid Gitleaks baseline format");
  for (const item of findings) {
    if (!item || typeof item !== "object" ||
        item.Match !== "REDACTED" || item.Secret !== "REDACTED" ||
        (item.Line !== undefined && item.Line !== "REDACTED")) {
      throw new Error("Gitleaks baseline contains unredacted candidate values");
    }
    if (typeof item.Fingerprint !== "string" || !item.Fingerprint) {
      throw new Error("Gitleaks baseline entry lacks a fingerprint");
    }
  }
  return findings.length;
}

export function summarizeFindings(findings) {
  if (!Array.isArray(findings)) throw new Error("Invalid Gitleaks report format");
  const counts = new Map();
  for (const item of findings) {
    if (!item || typeof item !== "object" ||
        typeof item.RuleID !== "string" || !item.RuleID) {
      throw new Error("Malformed Gitleaks finding");
    }
    // Do not print paths, matching lines, secrets, tokens or fingerprints.
    const rule = item.RuleID.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
    counts.set(rule, (counts.get(rule) ?? 0) + 1);
  }
  return {
    findings: findings.length,
    byRule: Object.fromEntries([...counts.entries()].sort(([a], [b]) =>
      a.localeCompare(b))),
  };
}

export function main(args) {
  if (args.length !== 2 ||
      !["--validate-baseline", "--fail-on-findings"].includes(args[0])) {
    throw new Error("Usage: gitleaks-report-gate.mjs --validate-baseline|--fail-on-findings FILE");
  }
  // Bound even malformed/adversarial reports before allocating the parser input.
  if (statSync(args[1]).size > 16 * 1024 * 1024) {
    throw new Error("Gitleaks report exceeds the safe parsing limit");
  }
  const findings = JSON.parse(readFileSync(args[1], "utf8"));
  if (args[0] === "--validate-baseline") {
    const entries = validateRedactedBaseline(findings);
    process.stdout.write(JSON.stringify({
      event: "security.gitleaks_baseline_valid",
      historicalCandidateCount: entries,
      note: "Historical candidates remain subject to private investigation and rotation",
    }) + "\n");
    return 0;
  }
  const summary = summarizeFindings(findings);
  process.stdout.write(JSON.stringify({
    event: "security.gitleaks_incremental_scan",
    ...summary,
  }) + "\n");
  if (summary.findings) {
    process.stderr.write("::error::Potential newly committed credential found. Reproduce findings privately, investigate and rotate confirmed secrets.\n");
    return 1;
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch {
    // Never echo parsed input, raw scanner error contents or candidate values.
    process.stderr.write("::error::Secret scanner result invalid or unreadable; failing closed.\n");
    process.exitCode = 2;
  }
}
