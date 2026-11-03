#!/usr/bin/env node
/**
 * Read-only integrity and coverage inventory for the detached parity-baseline branch.
 *
 * Usage:
 *   node scripts/audit/visual-baseline-inventory.mjs --root ../lms-parity-baseline
 *   node scripts/audit/visual-baseline-inventory.mjs --root ../lms-parity-baseline --json /tmp/visual-baseline-inventory.json
 *
 * This tool never modifies the reference tree and never marks a page visually
 * closed. A missing image, wrong package mapping or unexpected inventory count
 * is a blocker; screenshot aesthetic judgments require the separate browser
 * comparator and independent human visual review.
 */
import {
  existsSync, readFileSync, readdirSync, openSync, readSync, closeSync,
  statSync, writeFileSync,
} from "node:fs";
import { resolve, relative, dirname, join, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROLES = ["learner", "faculty", "mentor", "tpo", "admin", "coordinator"];
const SIDES = ["old", "vnext"];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function readText(file) {
  return readFileSync(file, "utf8");
}

function issue(code, file, message) {
  return { code, file, message };
}

function fileIn(root, rel) {
  const absolute = resolve(root, rel);
  const relativePath = relative(root, absolute);
  if (relativePath === ".." || relativePath.startsWith(".." + sep) || relativePath.startsWith(sep)) {
    return null;
  }
  return absolute;
}

/** No inferred screenshot pairing: the two sections can be in different orders. */
export function parsePackage(id, text) {
  const idMatch = text.match(/^#\s+([a-z]+-\d{3})\s*$/m);
  const page = text.match(/^Page:\s*`([^`]+)` on old LMS,\s*`([^`]+)` on vNext\./m);
  const role = id.split("-")[0];
  const image = { old: [], vnext: [] };
  let side = null;

  for (const line of text.split(/\r?\n/)) {
    if (/^## Old LMS\s*$/.test(line)) { side = "old"; continue; }
    if (/^## vNext\s*$/.test(line)) { side = "vnext"; continue; }
    const match = line.match(/^- `([^`]+\.png)`\s*(?:—|-)?\s*(.*)$/);
    if (match && side) {
      image[side].push({ path: match[1], label: match[2] || "" });
    }
  }

  return {
    id, role,
    headingMatches: idMatch?.[1] === id,
    oldRoute: page?.[1] ?? null,
    vnextRoute: page?.[2] ?? null,
    images: image,
    stateCount: image.old.length + image.vnext.length,
    captureFlags: [...image.old, ...image.vnext]
      .filter((img) => /\b(?:load-failed|blank|skeleton|signed-out)\b/i.test(img.label))
      .map((img) => ({ path: img.path, label: img.label })),
  };
}

function walkPngs(folder, root, into) {
  if (!existsSync(folder)) return;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const p = join(folder, entry.name);
    if (entry.isDirectory()) walkPngs(p, root, into);
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".png") {
      into.push(relative(root, p).split(sep).join("/"));
    }
  }
}

/** Reads PNG signature and IHDR dimensions without decoding large screenshots. */
export function inspectPng(filename) {
  const buffer = Buffer.alloc(24);
  const fd = openSync(filename, "r");
  try {
    const received = readSync(fd, buffer, 0, buffer.length, 0);
    if (received !== buffer.length ||
      !buffer.subarray(0, 8).equals(PNG_SIGNATURE) ||
      buffer.toString("ascii", 12, 16) !== "IHDR") {
      return { valid: false, width: null, height: null };
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { valid: width > 0 && height > 0, width, height };
  } finally {
    closeSync(fd);
  }
}

function classifyUnmatched(markdown) {
  const result = { old: 0, vnext: 0 };
  for (const line of markdown.split(/\r?\n/)) {
    if (/^- Only old LMS:/.test(line)) result.old++;
    if (/^- Only vNext:/.test(line)) result.vnext++;
  }
  return result;
}

export function auditBaseline(rootArg) {
  const root = resolve(rootArg);
  const findings = [];
  const expectedFiles = ["README.md", "summary.json", "packages/QUEUE.md"];
  for (const rel of expectedFiles) {
    if (!existsSync(resolve(root, rel))) findings.push(issue("MISSING_METADATA", rel, "Required baseline file absent"));
  }
  if (findings.length) {
    return { root, ok: false, findings, packages: [], counts: null };
  }

  const summary = readJson(join(root, "summary.json"));
  const summarized = new Map(summary.map((s) => [s.role, s]));
  const queue = readText(join(root, "packages", "QUEUE.md"))
    .split(/\r?\n/)
    .map((line) => /^- ([a-z]+-\d{3})\s*$/.exec(line)?.[1])
    .filter(Boolean);
  const duplicateQueue = queue.filter((id, idx) => queue.indexOf(id) !== idx);
  for (const id of duplicateQueue) findings.push(issue("DUPLICATE_PACKAGE", "packages/QUEUE.md", id));

  const records = [];
  const referenceCount = new Map();
  const actualByRole = {};
  const unmatchedByRole = {};
  const captureByRole = {};

  for (const id of queue) {
    const role = id.split("-")[0];
    const rel = "packages/" + id + ".md";
    const filename = join(root, rel);
    if (!ROLES.includes(role)) findings.push(issue("UNKNOWN_ROLE", rel, role));
    if (!existsSync(filename)) {
      findings.push(issue("MISSING_PACKAGE", rel, "Package is in queue but file is absent"));
      continue;
    }
    const record = parsePackage(id, readText(filename));
    records.push(record);
    if (!record.headingMatches) findings.push(issue("PACKAGE_ID", rel, "Header does not match queue id"));
    if (!record.oldRoute || !record.vnextRoute) findings.push(issue("PACKAGE_ROUTE", rel, "Cannot parse page route pair"));
    if (!record.stateCount) findings.push(issue("EMPTY_PACKAGE", rel, "No screenshot references"));
    if (record.stateCount > 10) findings.push(issue("PACKAGE_OVER_LIMIT", rel, "More than ten screenshot refs"));
    if (record.oldRoute === "-" && record.vnextRoute === "-") {
      findings.push(issue("BOTH_ROUTES_MISSING", rel, "No route on either side"));
    }

    for (const side of SIDES) for (const image of record.images[side]) {
      const ref = image.path.replaceAll("\\", "/");
      if (!ref.startsWith(side + "/" + role + "/") || !ref.endsWith(".png")) {
        findings.push(issue("WRONG_IMAGE_LOCATION", rel, ref));
        continue;
      }
      const target = fileIn(root, ref);
      if (!target) { findings.push(issue("PATH_TRAVERSAL", rel, ref)); continue; }
      if (!existsSync(target)) { findings.push(issue("MISSING_IMAGE", rel, ref)); continue; }
      const info = inspectPng(target);
      if (!info.valid) findings.push(issue("INVALID_PNG", rel, ref));
      else if (info.width !== 1280) findings.push(issue("NON_REFERENCE_WIDTH", rel, ref + ": " + info.width + "px"));
      referenceCount.set(ref, (referenceCount.get(ref) ?? 0) + 1);
    }
  }

  for (const [image, n] of referenceCount.entries()) {
    if (n > 1) findings.push(issue("DUPLICATE_IMAGE_REFERENCE", image, "Image referenced " + n + " times"));
  }

  for (const role of ROLES) {
    const screenshots = [];
    for (const side of SIDES) walkPngs(join(root, side, role), root, screenshots);
    actualByRole[role] = screenshots.length;
    const expected = summarized.get(role);
    if (!expected) {
      findings.push(issue("ROLE_NOT_IN_SUMMARY", "summary.json", role));
    } else {
      if (screenshots.length !== expected.images) {
        findings.push(issue("IMAGE_COUNT_MISMATCH", role, "summary=" + expected.images + " actual=" + screenshots.length));
      }
      const actualPackages = queue.filter((id) => id.startsWith(role + "-")).length;
      if (actualPackages !== expected.packages) {
        findings.push(issue("PACKAGE_COUNT_MISMATCH", role, "summary=" + expected.packages + " actual=" + actualPackages));
      }
    }
    const unmatchedPath = join(root, "packages", role + "-unmatched.md");
    if (existsSync(unmatchedPath)) {
      unmatchedByRole[role] = classifyUnmatched(readText(unmatchedPath));
      if (expected) {
        if (unmatchedByRole[role].old !== expected.oldOnly ||
            unmatchedByRole[role].vnext !== expected.vnextOnly) {
          findings.push(issue("UNMATCHED_COUNT_MISMATCH", role, "Unmatched route classifications diverge from summary"));
        }
      }
    } else findings.push(issue("MISSING_UNMATCHED", role, "Expected unmatched route inventory"));
    captureByRole[role] = {};
    for (const side of SIDES) {
      const cover = join(root, side, role, "coverage.json");
      if (existsSync(cover)) {
        const data = readJson(cover);
        captureByRole[role][side] = {
          routesInSource: data.routesInSource ?? null,
          reached: data.reached ?? null,
          notReached: data.notReached?.length ?? 0,
          loadFailed: data.loadFailedShots?.length ?? 0,
          httpErrors: data.httpErrors?.length ?? 0,
          blockedWrites: data.blockedWrites ?? 0,
          screenshots: data.screenshots ?? null,
        };
      } else if (!(role === "coordinator" && side === "vnext")) {
        findings.push(issue("MISSING_COVERAGE", side + "/" + role, "coverage.json missing"));
      }
    }
    for (const image of screenshots) {
      if (!referenceCount.has(image)) {
        findings.push(issue("UNREFERENCED_IMAGE", image, "Screenshot not listed in any queued package"));
      }
    }
  }

  const imageTotal = Object.values(actualByRole).reduce((a, b) => a + b, 0);
  const packageTotal = summary.reduce((a, s) => a + s.packages, 0);
  if (imageTotal !== summary.reduce((a, s) => a + s.images, 0)) {
    findings.push(issue("TOTAL_IMAGE_COUNT", "summary.json", String(imageTotal)));
  }
  if (queue.length !== packageTotal) findings.push(issue("TOTAL_PACKAGE_COUNT", "packages/QUEUE.md", String(queue.length)));

  return {
    root, ok: findings.length === 0, findings,
    counts: { packageQueue: queue.length, packageRecords: records.length, images: imageTotal,
      referencedImages: referenceCount.size, roles: ROLES.length,
      knownCaptureFlags: records.reduce((n, p) => n + p.captureFlags.length, 0) },
    actualByRole, unmatchedByRole, captureByRole,
    packages: records,
  };
}

function cliOptions(argv) {
  const options = { root: "", json: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root") options.root = argv[++i] ?? "";
    else if (argv[i] === "--json") options.json = argv[++i] ?? "";
    else throw new Error("Unknown argument: " + argv[i]);
  }
  if (!options.root) throw new Error("Provide --root pointing to a local checkout of parity-baseline");
  return options;
}

function main() {
  try {
    const options = cliOptions(process.argv.slice(2));
    const report = auditBaseline(options.root);
    if (options.json) {
      writeFileSync(resolve(options.json), JSON.stringify(report, null, 2) + "\n");
    }
    process.stdout.write(JSON.stringify({
      ok: report.ok, counts: report.counts,
      unmatchedByRole: report.unmatchedByRole,
      captureByRole: report.captureByRole,
      findings: report.findings.slice(0, 30),
      omittedFindings: Math.max(0, report.findings.length - 30),
    }, null, 2) + "\n");
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(String(error?.stack ?? error) + "\n");
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
