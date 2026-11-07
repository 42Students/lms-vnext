#!/usr/bin/env node
/**
 * Grouped UX improvement queue. The only mutable status source is
 * docs/tracker.json#uxReview; generated registry and parity specs are inputs/
 * evidence, not competing trackers.
 *
 * node scripts/ux-groups.mjs --summary
 * node scripts/ux-groups.mjs --unpicked --area learn
 * node scripts/ux-groups.mjs --group UX-G042
 * node scripts/ux-groups.mjs --pick UX-G042 --by chat-4
 * node scripts/ux-groups.mjs --start UX-G042 --by chat-4
 * node scripts/ux-groups.mjs --done UX-G042 --by chat-4 --evidence-file /tmp/evidence.json
 * node scripts/ux-groups.mjs --release UX-G042 --by chat-4
 * node scripts/ux-groups.mjs --check
 *
 * Mutation commands only edit the local JSON; first update from fresh main,
 * then review, commit and push without force. Remote conflicts must be
 * re-read/merged; local changes are not cross-chat locks.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const trackerPath = path.join(root, "docs/tracker.json");
const registryPath = path.join(root, "docs/audit/ui-surfaces/ui-surfaces.json");
const routesPath = path.join(root, "docs/planning/ui-surfaces.md");
export const UX_STATES = Object.freeze(["UNPICKED", "PICKED", "DOING", "DONE"]);

const goodText = x => typeof x === "string" && x.trim().length > 0;
const goodSha = x => typeof x === "string" && /^[a-f0-9]{40}$/i.test(x);
const unique = a => new Set(a).size === a.length;

export function inspectUxGroups(doc, { registry, routes } = {}) {
  const errors = [];
  const board = doc?.uxReview;
  if (board?.schemaVersion !== 1 || !Array.isArray(board?.groups))
    return { errors: ["UX_BOARD_MISSING"], groups: [], counts: {} };
  const groups = board.groups;
  const ids = [], files = [], refs = [], additionalRoutes = [];
  for (const g of groups) {
    ids.push(g.id);
    if (!/^UX-G\d{3,}$/.test(g.id)) errors.push("INVALID_GROUP_ID:" + g.id);
    if (!UX_STATES.includes(g.status)) errors.push("INVALID_STATUS:" + g.id);
    if (!goodText(g.title) || !goodText(g.area) || !goodText(g.type))
      errors.push("GROUP_MISSING_IDENTITY:" + g.id);
    if (!Array.isArray(g.sourceFiles) || !Array.isArray(g.surfaceIds) ||
        !Array.isArray(g.newRouteOnly) || !Array.isArray(g.evidence)) {
      errors.push("GROUP_INVALID_LISTS:" + g.id);
      continue;
    }
    if (!g.sourceFiles.length && !g.newRouteOnly.length)
      errors.push("GROUP_EMPTY:" + g.id);
    if (g.sourceFiles.length !== g.surfaceIds.length)
      errors.push("GROUP_MISMATCHED_REFS:" + g.id);
    for (const f of g.sourceFiles) if (!goodText(f)) errors.push("GROUP_BLANK_FILE:" + g.id);
    files.push(...g.sourceFiles);
    refs.push(...g.surfaceIds);
    additionalRoutes.push(...g.newRouteOnly);
    if (g.status === "UNPICKED" && g.pickedBy !== null)
      errors.push("UNPICKED_WITH_OWNER:" + g.id);
    if (g.status !== "UNPICKED" && !goodText(g.pickedBy))
      errors.push("PICKED_WITHOUT_OWNER:" + g.id);
    if (g.status === "DONE" && (!g.completedAt || !g.evidence.some(isCompletionEvidence)))
      errors.push("DONE_WITHOUT_PROOF:" + g.id);
  }
  if (!unique(ids)) errors.push("DUPLICATE_GROUP_ID");
  if (!unique(refs)) errors.push("DUPLICATE_REGISTRY_ENTRY");
  if (!unique(files)) errors.push("DUPLICATE_SOURCE_FILE");
  if (!unique(additionalRoutes)) errors.push("DUPLICATE_ADDITIONAL_ROUTE");

  if (registry) {
    const source = registry.surfaces ?? [];
    const sourceById = new Map(source.map(s => [s.id, s.file]));
    if (source.length !== refs.length) errors.push("REGISTRY_COVERAGE_CHANGED");
    for (let i = 0; i < refs.length; i++) {
      if (sourceById.get(refs[i]) !== files[i])
        errors.push("REGISTRY_ENTRY_CHANGED:" + refs[i]);
    }
  }
  if (registry && routes !== undefined) {
    const pageRoutes = new Set((registry.surfaces ?? []).filter(s => s.kind === "PAGE").map(s => s.route));
    const discovered = [...new Set(routes.split("\n").filter(line => line.startsWith("- /"))
      .map(line => line.slice(2).trim()))].filter(r => !pageRoutes.has(r));
    if (discovered.length !== additionalRoutes.length ||
        discovered.some(r => !additionalRoutes.includes(r)))
      errors.push("ROUTE_DISCOVERY_CHANGED");
  }
  const counts = Object.fromEntries(UX_STATES.map(s => [s, groups.filter(g => g.status === s).length]));
  return { errors: [...new Set(errors)], counts, groups,
    totalGroups: groups.length, referencedRegistry: refs.length, additionalRouteOnly: additionalRoutes.length,
    coveredEntries: refs.length + additionalRoutes.length };
}

export function isCompletionEvidence(evidence) {
  return Boolean(evidence && goodSha(evidence.commitSha) &&
    goodText(evidence.parityDoc) && evidence.parityDoc.startsWith("docs/parity/") &&
    Array.isArray(evidence.tests) && evidence.tests.length &&
    evidence.tests.every(t => goodText(t.command) && t.passed === true && goodText(t.proof)) &&
    Array.isArray(evidence.browser) &&
    ["desktop", "mobile"].every(v => evidence.browser.some(b => b.viewport === v && goodText(b.proof))) &&
    goodText(evidence.regressionReview) && goodText(evidence.securityReview));
}

export function transitionUxGroup(doc, { action, id, by, evidence, now = new Date().toISOString() }) {
  if (!["pick", "start", "done", "release"].includes(action))
    throw new Error("Invalid UX action");
  if (!goodText(id) || !goodText(by)) throw new Error("Group ID and --by owner are required");
  const group = doc?.uxReview?.groups?.find(g => g.id === id);
  if (!group) throw new Error("Unknown UX group: " + id);
  if (action === "pick") {
    if (group.status !== "UNPICKED") throw new Error(id + " is already " + group.status);
    group.status = "PICKED"; group.pickedBy = by; group.pickedAt = now;
  } else {
    if (group.pickedBy !== by)
      throw new Error(id + " is assigned to " + (group.pickedBy ?? "no one"));
    if (action === "start") {
      if (group.status !== "PICKED") throw new Error(id + " must be PICKED to start");
      group.status = "DOING"; group.startedAt = now;
    } else if (action === "done") {
      if (group.status !== "DOING") throw new Error(id + " must be DOING before DONE");
      if (!isCompletionEvidence(evidence))
        throw new Error("DONE requires commit SHA, parity doc, executed tests/proofs, desktop/mobile browser proofs and regression/security reviews");
      group.status = "DONE"; group.completedAt = now;
      group.evidence.push(evidence);
    } else {
      if (!["PICKED", "DOING"].includes(group.status))
        throw new Error("Only PICKED/DOING groups can be released");
      group.status = "UNPICKED"; group.pickedBy = null;
      group.pickedAt = null; group.startedAt = null;
    }
  }
  return group;
}

function argValue(argv, flag) {
  const at = argv.indexOf(flag);
  return at < 0 ? null : argv[at + 1] || null;
}
function listGroups(groups, limit, json = false) {
  if (json) return console.log(JSON.stringify(groups, null, 2));
  for (const g of groups.slice(0, limit)) {
    const n = g.sourceFiles.length + g.newRouteOnly.length;
    console.log(g.id.padEnd(8) + " " + g.status.padEnd(8) + " " + String(n).padStart(3) +
      " items  " + g.title + (g.pickedBy ? "  [" + g.pickedBy + "]" : ""));
  }
  if (groups.length > limit) console.log("... " + (groups.length - limit) + " more; use --limit N, --area or --json");
}

function main() {
  const argv = process.argv.slice(2);
  const doc = JSON.parse(fs.readFileSync(trackerPath, "utf8"));
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const routes = fs.readFileSync(routesPath, "utf8");
  const report = inspectUxGroups(doc, { registry, routes });
  if (report.errors.length) {
    console.error("UX board consistency errors: " + report.errors.join(", "));
    process.exitCode = 2;
    return;
  }
  if (argv.includes("--check")) {
    console.log("UX group registry coverage OK: " + report.coveredEntries + " entries in " + report.totalGroups + " groups");
    return;
  }
  const actions = ["pick", "start", "done", "release"].filter(a => argv.includes("--" + a));
  if (actions.length > 1) throw new Error("Only one mutation per invocation");
  if (actions.length) {
    const action = actions[0];
    const evidenceFile = argValue(argv, "--evidence-file");
    const evidence = evidenceFile ? JSON.parse(fs.readFileSync(path.resolve(evidenceFile), "utf8")) : undefined;
    const changed = transitionUxGroup(doc, {
      action, id: argValue(argv, "--" + action), by: argValue(argv, "--by"), evidence
    });
    const after = inspectUxGroups(doc, {registry,routes});
    if (after.errors.length) throw new Error("Mutation rejected: " + after.errors.join(", "));
    fs.writeFileSync(trackerPath, JSON.stringify(doc, null, 2) + "\n");
    console.log(changed.id + " is now " + changed.status + (changed.pickedBy ? " (" + changed.pickedBy + ")" : ""));
    console.log("Review/commit this tracker-only change from fresh main; reconcile GitHub conflicts rather than force-pushing.");
    return;
  }
  if (argv.includes("--summary") || !argv.length) {
    console.log(JSON.stringify({
      groups: report.totalGroups, statuses: report.counts,
      registeredEntries: report.referencedRegistry, additionalRoutes: report.additionalRouteOnly,
      coveredEntries: report.coveredEntries, note: "These are assigned coverage items, NOT UX-verified completions."
    }, null, 2));
    return;
  }
  const requestedId = argValue(argv, "--group");
  if (requestedId) {
    const match = report.groups.find(g => g.id === requestedId);
    if (!match) throw new Error("Unknown group: " + requestedId);
    console.log(JSON.stringify(match, null, 2));
    return;
  }
  const status = ["unpicked", "picked", "doing", "done"].find(st => argv.includes("--" + st));
  const area = argValue(argv, "--area");
  const type = argValue(argv, "--type");
  const selected = report.groups.filter(g =>
    (!status || g.status === status.toUpperCase()) &&
    (!area || g.area === area) && (!type || g.type.toLowerCase() === type.toLowerCase()));
  const limitValue = Number(argValue(argv, "--limit") ?? 20);
  const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : 20;
  listGroups(selected, limit, argv.includes("--json"));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 2; }
}
