// Builds docs/security/tracker-updates-pending.json from the assessment tables.
// It never touches docs/tracker.json. Each record keeps runUrl/commitSha empty until a CI run exists.
const fs = require("fs");
const path = require("path");
const dir = "docs/security/assessments";
const tracker = require("../../docs/tracker.json").security.controls;

function expand(token, group) {
  // "005", "019-024", "005, 006, 008", "001-003, 005"
  const out = [];
  for (const part of token.split(/[,;]|\band\b/).map((s) => s.trim()).filter(Boolean)) {
    const range = part.match(/^(\d{3})\s*[-–]\s*(\d{3})/);
    const one = part.match(/^(\d{3})\b/);
    if (range) {
      for (let n = Number(range[1]); n <= Number(range[2]); n++) out.push(`${group}-${String(n).padStart(3, "0")}`);
    } else if (one) out.push(`${group}-${one[1]}`);
  }
  return out;
}

function stateOf(text) {
  const t = text.split("*").join("").trim().toUpperCase();
  if (/^IMPLEMENTED[_ ]UNVERIFIED/.test(t)) return "IMPLEMENTED_UNVERIFIED";
  if (/^GAP/.test(t)) return "GAP_CONFIRMED";
  if (/^PARTIAL/.test(t)) return "PARTIAL_EVIDENCE";
  if (/^UNASSESSED|^NOT INSPECTED/.test(t)) return "UNASSESSED";
  return null;
}

const records = {};
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "INDEX.md")) {
  const lines = fs.readFileSync(path.join(dir, file), "utf8").split(/\r?\n/);
  const fileGroups = [...file.matchAll(/SEC-(\d\d)/g)].map((m) => `SEC-${m[1]}`);
  let group = fileGroups[0] || null;
  for (const line of lines) {
    const h = line.match(/^#{1,4}\s.*?\bSEC-(\d\d)\b/);
    if (h) group = `SEC-${h[1]}`;
    const inline = line.match(/^\|\s*(SEC-\d\d)[-\s]/);
    if (!/^\|\s*(SEC-\d\d-)?\d{3}/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    let g = group;
    let first = cells[0];
    const full = first.match(/^(SEC-\d\d)-/);
    if (full) g = full[1];
    if (!g) continue;
    const ids = expand(first.replace(/^SEC-\d\d-/, ""), g);
    const stateCell = cells.slice(1).find((c) => stateOf(c));
    if (!stateCell) continue;
    const state = stateOf(stateCell);
    const finding = cells[1];
    const missing = cells.length >= 4 ? cells[2 + 0 === 1 ? 2 : 2] : "";
    for (const id of ids) {
      if (!tracker[id]) continue;
      if (records[id] && records[id].state !== "UNASSESSED") continue; // first real answer wins
      records[id] = { state, finding, source: file };
    }
  }
}

// Hand-mapped area assessments (SEC-03/04/08/09/11/12/15/16/17/21): fill controls the table parser did not cover.
const STATE = { IU: "IMPLEMENTED_UNVERIFIED", P: "PARTIAL_EVIDENCE", G: "GAP_CONFIRMED" };
const overlay = JSON.parse(fs.readFileSync(path.join(__dirname, "area-mappings.json"), "utf8"));
for (const row of overlay.rows) {
  for (const id of row.ids) {
    if (!tracker[id]) throw new Error("unknown control in area-mappings.json: " + id);
    if (records[id] && records[id].state !== "UNASSESSED") continue;
    records[id] = { state: STATE[row.state], finding: row.finding, source: row.source };
  }
}

// Final dispositions (R = built, needs independent review; O = needs the owner) override earlier partial answers.
const disp = JSON.parse(fs.readFileSync(path.join(__dirname, "dispositions.json"), "utf8"));
for (const row of disp.rows) {
  for (const id of row.ids) {
    if (!tracker[id]) throw new Error("unknown control in dispositions.json: " + id);
    records[id] = {
      state: row.d === "R" ? "IMPLEMENTED_UNVERIFIED" : "GAP_CONFIRMED",
      finding: (row.d === "O" ? "NEEDS THE OWNER. " : "") + row.finding,
      source: "dispositions.json",
      ownerBlocked: row.d === "O",
    };
  }
}

const out = {};
const counts = {};
for (const id of Object.keys(records).sort()) {
  const r = records[id];
  const current = tracker[id].state;
  counts[r.state] = (counts[r.state] || 0) + 1;
  if (r.state === "UNASSESSED") continue;
  out[id] = {
    currentTrackerState: current,
    proposedState: r.state,
    assessedAt: "2026-11-08",
    ...(r.ownerBlocked ? { ownerBlocked: true } : {}),
    finding: r.finding,
    source: r.source === "dispositions.json" ? "scripts/security/dispositions.json" : "docs/security/assessments/" + r.source,
    evidence: [{ type: "EXECUTED_SCOPED_TEST", commitSha: "", runUrl: "", scope: "FILL AFTER THE CI RUN: the exact tests/checks that ran" }],
    nextProof: "FILL: independent review, plus any listed missing proof in the source assessment",
    ...(r.state === "IMPLEMENTED_UNVERIFIED" ? { remainingChecks: ["Passing CI run at the recorded commit", "Independent review", "See the source assessment for control-specific missing proof"] } : {}),
  };
}
fs.writeFileSync(
  "docs/security/tracker-updates-pending.json",
  JSON.stringify(
    {
      note: "DRAFT. Not read by any validator. Merge into docs/tracker.json only after a passing CI run: fill commitSha (40 hex) and runUrl, then run node scripts/tracker.mjs --check. Never VERIFIED from here.",
      generatedFrom: "docs/security/assessments/*.md",
      counts,
      controls: out,
    },
    null,
    1,
  ) + "\n",
);
console.log("controls with a proposed non-UNASSESSED state:", Object.keys(out).length, counts);
