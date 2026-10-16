/**
 * Report writers for NSRIT stage 2b-ii. Counts, reason codes, legacy numeric
 * ids and masked references only: no names, contacts, message text or URLs.
 */
import type { Validation } from "./db";
import type { Plan2bii } from "./plan-2bii";
import type { Reconciliation2bii } from "./reconcile-2bii";
import type { LoadCounts } from "./reports";

export type Reconciliation2biiReport = {
  stage: "2b-ii";
  mode: "dry-run" | "apply" | "rollback";
  batchId: string | null;
  snapshotSha256: string;
  loaderVersion: string;
  entities: { entity: string; legacy: number; planned: number; rejected: number; rejectedByReason: Record<string, number>; deferred: number }[];
  loadedTables: LoadCounts;
  notes: Record<string, number>;
  notLoaded: Plan2bii["notLoaded"];
  blocked: number;
  validation: Validation[];
  derived: Reconciliation2bii | null;
  timingsMs: Record<string, number>;
};

export function buildReconciliation2bii(
  plan: Plan2bii,
  loaded: LoadCounts,
  meta: Pick<Reconciliation2biiReport, "mode" | "batchId" | "snapshotSha256" | "loaderVersion"> & {
    validation?: Validation[];
    derived?: Reconciliation2bii | null;
    timingsMs?: Record<string, number>;
  },
): Reconciliation2biiReport {
  const entities = Object.entries(plan.stats).map(([entity, s]) => ({
    entity,
    legacy: s.legacy,
    planned: s.planned,
    rejected: Object.values(s.rejected).reduce((a, b) => a + (b ?? 0), 0),
    rejectedByReason: s.rejected as Record<string, number>,
    deferred: s.deferred,
  }));
  return {
    stage: "2b-ii",
    mode: meta.mode,
    batchId: meta.batchId,
    snapshotSha256: meta.snapshotSha256,
    loaderVersion: meta.loaderVersion,
    entities,
    loadedTables: loaded,
    notes: plan.notes,
    notLoaded: plan.notLoaded,
    blocked: plan.blocked.length,
    validation: meta.validation ?? [],
    derived: meta.derived ?? null,
    timingsMs: meta.timingsMs ?? {},
  };
}

export function reconciliationMarkdown2bii(r: Reconciliation2biiReport): string {
  const lines = [
    `# NSRIT stage 2b-ii reconciliation (${r.mode})`,
    "",
    `batch: ${r.batchId ?? "-"}  snapshot: ${r.snapshotSha256.slice(0, 16)}  loader: ${r.loaderVersion}`,
    "",
    "| entity | legacy | planned | rejected | deferred |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];
  for (const e of r.entities) lines.push(`| ${e.entity} | ${e.legacy} | ${e.planned} | ${e.rejected} | ${e.deferred} |`);
  lines.push("", "## Rejections by reason", "", "| entity | reason | count |", "| --- | --- | ---: |");
  for (const e of r.entities) for (const [reason, n] of Object.entries(e.rejectedByReason)) lines.push(`| ${e.entity} | ${reason} | ${n} |`);
  lines.push("", "## Target tables", "", "| table | inserted | updated | unchanged |", "| --- | ---: | ---: | ---: |");
  for (const [table, c] of Object.entries(r.loadedTables)) lines.push(`| ${table} | ${c.inserted} | ${c.updated} | ${c.unchanged} |`);
  lines.push("", "## Notes", "");
  for (const [k, v] of Object.entries(r.notes)) lines.push(`- ${k}: ${v}`);
  if (r.blocked) lines.push(`- recruiters blocked (shared contact): ${r.blocked}`);
  lines.push("", "## Legacy tables not loaded in this stage", "", "| legacy table | NSRIT rows | reason |", "| --- | ---: | --- |");
  for (const n of r.notLoaded) lines.push(`| ${n.table} | ${n.rows} | ${n.reason} |`);
  if (r.validation.length) {
    lines.push("", "## Validation", "");
    for (const v of r.validation) lines.push(`- ${v.ok ? "PASS" : "FAIL"} ${v.check}: ${v.detail}`);
  }
  if (r.derived) {
    const d = r.derived;
    lines.push("", "## Derived numbers: legacy-computed vs vNext-computed", "");
    lines.push("| metric | legacy | vNext / matched |", "| --- | ---: | ---: |");
    lines.push(`| placed learners | ${d.placedLearners.legacy} | ${d.placedLearners.vnext} |`);
    lines.push(`| offers per application (compared / matched) | ${d.offersPerApplication.compared} | ${d.offersPerApplication.matched} |`);
    lines.push(`| applications per drive (compared / matched) | ${d.applicationsPerDrive.compared} | ${d.applicationsPerDrive.matched} |`);
    lines.push(`| accepted CTC total (INR) | ${d.ctcTotalInr.legacy} | ${d.ctcTotalInr.vnext} |`);
    lines.push(`| accepted CTC per drive (compared / matched) | ${d.ctcPerDrive.compared} | ${d.ctcPerDrive.matched} |`);
    lines.push(`| application stage consistent (compared / matched) | ${d.stageConsistency.compared} | ${d.stageConsistency.matched} |`);
    lines.push(`| project progress, same formula (compared / matched) | ${d.projectProgress.compared} | ${d.projectProgress.derivedMatched} |`);
    lines.push(`| project progress, legacy stored value (compared / matched) | ${d.projectProgress.compared} | ${d.projectProgress.storedMatched} |`);
    lines.push("", `Mismatches: ${d.mismatches.length}`);
    for (const m of d.mismatches.slice(0, 80)) lines.push(`- ${m.ref} ${m.metric}: legacy ${m.legacy} | vNext ${m.vnext}`);
    if (d.mismatches.length > 80) lines.push(`- ... (+${d.mismatches.length - 80} more in the JSON report)`);
  }
  if (Object.keys(r.timingsMs).length) {
    lines.push("", "## Timings (ms)", "");
    for (const [k, v] of Object.entries(r.timingsMs)) lines.push(`- ${k}: ${v}`);
  }
  return `${lines.join("\n")}\n`;
}

export function rejectionReportMarkdown2bii(plan: Plan2bii): string {
  const lines = ["# NSRIT stage 2b-ii rejected rows (masked)", "", "| entity | reason | count | legacy ids |", "| --- | --- | ---: | --- |"];
  const buckets = new Map<string, string[]>();
  for (const r of plan.rejections) {
    const key = `${r.entity}|${r.reason}`;
    buckets.set(key, [...(buckets.get(key) ?? []), r.legacyId]);
  }
  for (const [key, ids] of [...buckets.entries()].sort()) {
    const [entity, reason] = key.split("|");
    const shown = ids.length > 40 ? `${ids.slice(0, 40).join(", ")}, ... (+${ids.length - 40})` : ids.join(", ");
    lines.push(`| ${entity} | ${reason} | ${ids.length} | ${shown} |`);
  }
  lines.push("", "## Blocked recruiters (shared contact, never merged)", "", `${plan.blocked.length} row(s)`);
  lines.push("", "## Legacy tables not loaded in this stage", "", "| legacy table | NSRIT rows | reason |", "| --- | ---: | --- |");
  for (const n of plan.notLoaded) lines.push(`| ${n.table} | ${n.rows} | ${n.reason} |`);
  return `${lines.join("\n")}\n`;
}
