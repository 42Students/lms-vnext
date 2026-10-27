#!/usr/bin/env node
// Read-only index of the existing parity specs. Never writes project task status.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ACCOUNTS = [
  ["learner", "learner.md"], ["faculty", "faculty.md"],
  ["mentor", "mentor.md"], ["college-admin", "college-admin.md"],
  ["super-admin", "super-admin.md"], ["tpo", "tpo.md"],
  ["recruiter", "hr.md"], ["shared-public", "shared-public-ops.md"],
];
const PAGE = /^## (Page(?: family|\/section)?|Public Page|Flow|Report|Settings|Workspace section|Template section|Tab|Retired route):\s*(.*?)\s*$/i;
const RECEIPT = /<!--\s*page-closure\s*\n([\s\S]*?)\n\s*-->/g;
const SHA = /^[a-f0-9]{40}$/i;
const REQUIRED = ["functional", "authorization", "browser-desktop", "browser-mobile"];

export function slug(s) {
  return s.replace(/\s+[—–-]\s+(DONE|PARTIAL|ACCEPTED|PENDING|VERIFIED)\b.*$/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function validateReceipt(id, receipt, completed, open) {
  const problems = [];
  if (!receipt) return { implementationGreen: false, designGreen: false,
    releaseGreen: false, blocked: false, blockers: [], problems };
  const i = receipt.implementation;
  if (receipt.id !== id) problems.push("receipt ID must be " + id);
  if (!i || !["open", "blocked", "green"].includes(i.status))
    problems.push("implementation.status must be open, blocked or green");
  if (i?.status === "blocked" && (!Array.isArray(i.blockers) || !i.blockers.length))
    problems.push("blocked pages must name specific blockers");
  if (i?.status === "green") {
    if (!completed || open) problems.push("all nonempty legacy checklist requirements must pass");
    for (const key of ["legacyFeSha", "legacyBeSha", "vnextSha"])
      if (!SHA.test(i[key] || "")) problems.push(key + " must be a full commit SHA");
    if (i.inventoryComplete !== true || i.unmappedRequired !== 0 || i.openP0P1 !== 0)
      problems.push("required inventory, mapping and P0/P1 gates are still open");
    for (const key of ["surfaces", "actions", "states"]) {
      if (!Array.isArray(i[key]) || !i[key].length ||
        i[key].some(v => typeof v !== "string" || !v.trim()) ||
        new Set(i[key]).size !== i[key].length)
        problems.push("provide unique named " + key + " IDs");
    }
    for (const kind of REQUIRED) {
      if (!Array.isArray(i.evidence) || !i.evidence.some(e => e?.kind === kind &&
        e?.result === "passed" && e?.sha === i.vnextSha &&
        /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+(?:\/.*)?$/.test(e.url || "")))
        problems.push("missing post-change passing Actions evidence for " + kind);
    }
    if (i.changedLegacyBehavior === true && !/^https:\/\//.test(i.approvalUrl || ""))
      problems.push("redesign/retirement requires an approval URL");
  }
  const implementationGreen = i?.status === "green" && problems.length === 0;
  function gate(name, prerequisite) {
    if (receipt[name]?.status !== "green") return false;
    if (!prerequisite || !Array.isArray(receipt[name].evidence) ||
      !receipt[name].evidence.length) {
      problems.push(name + " green needs passing earlier gates and evidence");
      return false;
    }
    return true;
  }
  const designGreen = gate("design", implementationGreen);
  const releaseGreen = gate("release", implementationGreen && designGreen);
  return { implementationGreen, designGreen, releaseGreen, blocked: i?.status === "blocked",
    blockers: i?.blockers || [], problems };
}

export function parseAccount(md, account, file) {
  const lines = md.split(/\r?\n/);
  const headingIndexes = lines.flatMap((line, index) => /^## (?!#)/.test(line) ? [index] : []);
  const grouped = new Map();
  const recognized = new Set();
  for (let h = 0; h < headingIndexes.length; h++) {
    const start = headingIndexes[h];
    const match = lines[start].match(PAGE);
    if (!match) continue;
    recognized.add(start);
    const end = headingIndexes[h + 1] ?? lines.length;
    const section = lines.slice(start, end);
    const kind = match[1].toLowerCase();
    // Type-qualified IDs keep genuinely distinct nested surfaces separate.
    const prefixes = {
      "workspace section": "workspace-", "template section": "template-",
      "report": "report-", "settings": "settings-", "tab": "tab-",
      "retired route": "redirect-",
    };
    const id = account + ":" + (prefixes[kind] || "") + slug(match[2]);
    const entry = grouped.get(id) || {
      id, name: match[2], account, file, line: start + 1, kind, locations: [],
      checked: 0, unchecked: 0, receipts: [], problems: [],
    };
    entry.checked += section.filter(x => /^\s*-\s*\[[xX]\]\s+/.test(x)).length;
    entry.unchecked += section.filter(x => /^\s*-\s*\[ \]\s+/.test(x)).length;
    entry.locations.push(start + 1);
    const matches = [...section.join("\n").matchAll(RECEIPT)];
    for (const row of matches) {
      try { entry.receipts.push(JSON.parse(row[1])); }
      catch { entry.problems.push("invalid JSON receipt at line " + (start + 1)); }
    }
    grouped.set(id, entry);
  }
  for (const index of lines.keys()) {
    if (!lines[index].includes("<!-- page-closure")) continue;
    const ownerHeading = [...headingIndexes].reverse().find(n => n <= index);
    if (ownerHeading === undefined || !recognized.has(ownerHeading)) {
      const id = account + ":orphan:" + (index + 1);
      grouped.set(id, { id, name: "orphan receipt", account, file, line: index + 1,
        kind: "orphan", locations: [index + 1], checked: 0, unchecked: 0,
        receipts: [], problems: ["receipt outside a recognized page family"] });
    }
  }
  return [...grouped.values()].map(entry => {
    if (entry.receipts.length > 1) entry.problems.push("multiple acceptance receipts for one page family");
    const status = validateReceipt(entry.id, entry.receipts[0] || null,
      entry.checked, entry.unchecked);
    const { receipts, ...publicEntry } = entry;
    return { ...publicEntry, ...status,
      problems: [...publicEntry.problems, ...status.problems] };
  });
}

export function reportFromFiles(filePairs) {
  const pages = filePairs.flatMap(row => parseAccount(row.markdown, row.account, row.file));
  const accounts = ACCOUNTS.map(([account]) => {
    const p = pages.filter(x => x.account === account);
    return { account, families: p.length,
      implementationGreen: p.filter(x => x.implementationGreen).length,
      designGreen: p.filter(x => x.designGreen).length,
      releaseGreen: p.filter(x => x.releaseGreen).length,
      blocked: p.filter(x => x.blocked).length,
      readyForWork: p.filter(x => !x.implementationGreen && !x.blocked).length };
  });
  return { accounts, pages, invalid: pages.flatMap(p => p.problems.map(message => ({
    file: p.file, line: p.line, id: p.id, message }))) };
}
export function nextFamily(report, account) {
  const name = account === "hr" ? "recruiter" : account;
  return report.pages.find(p => (!name || p.account === name) &&
    !p.implementationGreen && !p.blocked) || null;
}
export function nextPhaseTask(tracker) {
  const pending = tracker.tasks.filter(t => t.phase === tracker.currentPhase && !t.done);
  const done = new Set(tracker.tasks.filter(t => t.done).map(t => t.id));
  return { phase: tracker.currentPhase, remaining: pending.length,
    next: pending.find(t => (t.dependsOn || []).every(id => done.has(id))) || null };
}
export function run(argv = process.argv.slice(2), root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")) {
  if (argv.includes("--help")) {
    console.log("Usage: npm run parity:closure -- [--check] [--json] [--next] [--account faculty]");
    return 0;
  }
  const index = argv.indexOf("--account");
  const arg = argv.find(s => s.startsWith("--account="));
  const account = arg ? arg.slice(10) : index < 0 ? null : argv[index + 1];
  if (index >= 0 && (!account || account.startsWith("--"))) throw new Error("--account needs a value");
  if (account && !ACCOUNTS.some(x => x[0] === account) && account !== "hr")
    throw new Error("Unknown account: " + account);
  const pairs = ACCOUNTS.map(([a, name]) => ({ account: a, file: "docs/parity/" + name,
    markdown: fs.readFileSync(path.join(root, "docs/parity", name), "utf8") }));
  const report = reportFromFiles(pairs);
  const phase = nextPhaseTask(JSON.parse(fs.readFileSync(path.join(root, "docs/tracker.json"), "utf8")));
  if (argv.includes("--next")) {
    const page = account ? nextFamily(report, account) : null;
    console.log(JSON.stringify(account ? { scope: account, currentPhase: phase.phase,
      notice: phase.phase !== "UI" ? "UI phase not globally certified; selection is informational" : null,
      next: page ? { id: page.id, name: page.name, file: page.file, line: page.line,
        checked: page.checked, unchecked: page.unchecked } : null } :
      { scope: "project", currentPhase: phase.phase, remainingInPhase: phase.remaining,
        next: phase.next ? { id: phase.next.id, title: phase.next.title } : null,
        note: "Unscoped continuation uses the official project phase; use --account for pages." }, null, 2));
  } else {
    console.log(JSON.stringify({ currentPhase: phase.phase, accounts: report.accounts,
      invalidReceiptCount: report.invalid.length,
      ...(argv.includes("--json") ? { pages: report.pages } : {}) }, null, 2));
  }
  if (argv.includes("--check")) {
    for (const error of report.invalid) console.error(error.file + ":" + error.line + ": " + error.message);
    console.error(report.invalid.length ? "INVALID acceptance records" :
      "Structural validation passed. Live CI evidence still needs independent verification.");
  }
  return argv.includes("--check") && report.invalid.length ? 1 : 0;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = run(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
