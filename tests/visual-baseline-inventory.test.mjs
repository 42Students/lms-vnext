import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { parsePackage, inspectPng, auditBaseline, ROLES } from "../scripts/audit/visual-baseline-inventory.mjs";

function mkfile(root, rel, content) {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function pngHeader(width = 1280, height = 800) {
  const bytes = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function buildFixture(root) {
  mkfile(root, "README.md", "# Reference\n");
  const summary = [];
  const queue = [];
  for (const role of ROLES) {
    const id = role + "-001";
    const old = "old/" + role + "/base.png";
    const newer = "vnext/" + role + "/base.png";
    const hasVnext = role !== "coordinator";
    queue.push("- " + id);
    const oldOnly = role === "coordinator" ? 1 : 0;
    summary.push({ role, images: hasVnext ? 2 : 1, packages: 1,
      pagesOnBoth: hasVnext ? 1 : 0, oldOnly, vnextOnly: 0 });
    let content = "# " + id + "\n\nPage: `/" + role + "` on old LMS, " +
      (hasVnext ? "`/" + role + "`" : "`-`") + " on vNext. Part 1 of 1.\n\n" +
      "## Old LMS\n- `" + old + "` — base\n\n## vNext\n" +
      (hasVnext ? "- `" + newer + "` — base\n" : "- none in this part\n");
    mkfile(root, "packages/" + id + ".md", content);
    mkfile(root, old, pngHeader());
    if (hasVnext) mkfile(root, newer, pngHeader());
    mkfile(root, "packages/" + role + "-unmatched.md",
      role === "coordinator" ? "# unmatched\n\n- Only old LMS: `/coordinator` (1 screens)\n" : "# unmatched\n");
    mkfile(root, "old/" + role + "/coverage.json",
      JSON.stringify({ routesInSource: 1, reached: 1, notReached: [], screenshots: 1 }));
    if (hasVnext) mkfile(root, "vnext/" + role + "/coverage.json",
      JSON.stringify({ routesInSource: 1, reached: 1, notReached: [], screenshots: 1 }));
  }
  mkfile(root, "summary.json", JSON.stringify(summary));
  mkfile(root, "packages/QUEUE.md", "# Package queue\n\n" + queue.join("\n") + "\n");
}

test("parsePackage reads old and vNext states without assuming ordering", () => {
  const parsed = parsePackage("mentor-001", [
    "# mentor-001",
    "",
    "Page: `/mentor/calendar` on old LMS, `/mentor/calendar` on vNext. Part 1 of 1.",
    "",
    "## Old LMS",
    "- `old/mentor/base.png` — base",
    "## vNext",
    "- `vnext/mentor/failed.png` — base (load-failed)",
  ].join("\n"));
  assert.equal(parsed.headingMatches, true);
  assert.equal(parsed.oldRoute, "/mentor/calendar");
  assert.equal(parsed.vnextRoute, "/mentor/calendar");
  assert.equal(parsed.images.old.length, 1);
  assert.equal(parsed.images.vnext.length, 1);
  assert.equal(parsed.captureFlags.length, 1);
  assert.match(parsed.captureFlags[0].label, /load-failed/);
});

test("inspectPng reads dimensions only from valid PNG IHDR", () => {
  const root = mkdtempSync(join(tmpdir(), "lms-png-"));
  try {
    mkfile(root, "correct.png", pngHeader(1280, 910));
    mkfile(root, "invalid.png", Buffer.from("not a png"));
    assert.deepEqual(inspectPng(join(root, "correct.png")), {
      valid: true, width: 1280, height: 910,
    });
    assert.equal(inspectPng(join(root, "invalid.png")).valid, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("auditBaseline verifies an intact fixture without modifying reference files", () => {
  const root = mkdtempSync(join(tmpdir(), "lms-baseline-"));
  try {
    buildFixture(root);
    const report = auditBaseline(root);
    assert.equal(report.ok, true, JSON.stringify(report.findings));
    assert.equal(report.counts.packageQueue, 6);
    assert.equal(report.counts.images, 11);
    assert.equal(report.counts.referencedImages, 11);
    assert.equal(report.unmatchedByRole.coordinator.old, 1);
    assert.equal(report.captureByRole.mentor.old.reached, 1);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("auditBaseline detects missing screenshot references", () => {
  const root = mkdtempSync(join(tmpdir(), "lms-baseline-missing-"));
  try {
    buildFixture(root);
    unlinkSync(join(root, "vnext/mentor/base.png"));
    const report = auditBaseline(root);
    assert.equal(report.ok, false);
    assert.ok(report.findings.some((x) => x.code === "MISSING_IMAGE" && x.file === "packages/mentor-001.md"));
    assert.ok(report.findings.some((x) => x.code === "IMAGE_COUNT_MISMATCH" && x.file === "mentor"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("auditBaseline detects unexpected dimensions and inconsistent summary data", () => {
  const root = mkdtempSync(join(tmpdir(), "lms-baseline-dimensions-"));
  try {
    buildFixture(root);
    mkfile(root, "old/admin/base.png", pngHeader(1400, 800));
    const report = auditBaseline(root);
    assert.equal(report.ok, false);
    assert.ok(report.findings.some((x) => x.code === "NON_REFERENCE_WIDTH"));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
