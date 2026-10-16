/**
 * Report writers for NSRIT stage 2b-i. Counts, reason codes, legacy numeric
 * ids and masked references only (no names, phones, e-mails or free text).
 */
import type { LoadCounts } from "./reports";
import type { AcademicsPlan } from "./plan-academics";
import type { ReconciliationOutcome } from "./reconcile";
import type { Validation } from "./db";

export type AcademicsReconciliation = {
  stage: "2b-i";
  mode: "dry-run" | "apply" | "rollback";
  batchId: string | null;
  snapshotSha256: string;
  loaderVersion: string;
  entities: {
    entity: string;
    legacy: number;
    planned: number;
    rejected: number;
    rejectedByReason: Record<string, number>;
    deferred: number;
  }[];
  loadedTables: LoadCounts;
  notes: Record<string, number>;
  validation: Validation[];
  derived: ReconciliationOutcome | null;
  timingsMs: Record<string, number>;
};

export function buildAcademicsReconciliation(
  plan: AcademicsPlan,
  loaded: LoadCounts,
  meta: Pick<AcademicsReconciliation, "mode" | "batchId" | "snapshotSha256" | "loaderVersion"> & {
    validation?: Validation[];
    derived?: ReconciliationOutcome | null;
    timingsMs?: Record<string, number>;
  },
): AcademicsReconciliation {
  const entities = Object.entries(plan.stats).map(([entity, s]) => ({
    entity,
    legacy: s.legacy,
    planned: s.planned,
    rejected: Object.values(s.rejected).reduce((a, b) => a + (b ?? 0), 0),
    rejectedByReason: s.rejected as Record<string, number>,
    deferred: s.deferred,
  }));
  return {
    stage: "2b-i",
    mode: meta.mode,
    batchId: meta.batchId,
    snapshotSha256: meta.snapshotSha256,
    loaderVersion: meta.loaderVersion,
    entities,
    loadedTables: loaded,
    notes: plan.notes,
    validation: meta.validation ?? [],
    derived: meta.derived ?? null,
    timingsMs: meta.timingsMs ?? {},
  };
}

export function academicsReconciliationMarkdown(r: AcademicsReconciliation): string {
  const lines = [
    `# NSRIT stage 2b-i reconciliation (${r.mode})`,
    "",
    `batch: ${r.batchId ?? "-"}  snapshot: ${r.snapshotSha256.slice(0, 16)}  loader: ${r.loaderVersion}`,
    "",
    "| entity | legacy | planned | rejected | deferred |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];
  for (const e of r.entities) lines.push(`| ${e.entity} | ${e.legacy} | ${e.planned} | ${e.rejected} | ${e.deferred} |`);
  lines.push("", "## Rejections by reason", "", "| entity | reason | count |", "| --- | --- | ---: |");
  for (const e of r.entities) {
    for (const [reason, n] of Object.entries(e.rejectedByReason)) lines.push(`| ${e.entity} | ${reason} | ${n} |`);
  }
  lines.push("", "## Target tables", "", "| table | inserted | updated | unchanged |", "| --- | ---: | ---: | ---: |");
  for (const [table, c] of Object.entries(r.loadedTables)) lines.push(`| ${table} | ${c.inserted} | ${c.updated} | ${c.unchanged} |`);
  lines.push("", "## Notes", "");
  for (const [k, v] of Object.entries(r.notes)) lines.push(`- ${k}: ${v}`);
  if (r.validation.length) {
    lines.push("", "## Validation", "");
    for (const v of r.validation) lines.push(`- ${v.ok ? "PASS" : "FAIL"} ${v.check}: ${v.detail}`);
  }
  if (r.derived) {
    const d = r.derived;
    lines.push("", "## Derived counts: legacy-computed vs vNext-computed", "");
    lines.push("| metric | learners compared | matched |", "| --- | ---: | ---: |");
    for (const metric of ["attendance", "progress", "marks"] as const) {
      lines.push(`| ${metric} | ${d.sampled[metric]} | ${d.matched[metric]} |`);
    }
    lines.push("", `Mismatches: ${d.mismatches.length}`);
    for (const m of d.mismatches.slice(0, 60)) lines.push(`- ${m.learner} ${m.metric}: legacy ${m.legacy} | vNext ${m.vnext}`);
    if (d.mismatches.length > 60) lines.push(`- ... (+${d.mismatches.length - 60} more in the JSON report)`);
  }
  if (Object.keys(r.timingsMs).length) {
    lines.push("", "## Timings (ms)", "");
    for (const [k, v] of Object.entries(r.timingsMs)) lines.push(`- ${k}: ${v}`);
  }
  return `${lines.join("\n")}\n`;
}

export function academicsRejectionReportMarkdown(plan: AcademicsPlan): string {
  const lines = ["# NSRIT stage 2b-i rejected rows (masked)", ""];
  lines.push("| entity | reason | count | legacy ids |", "| --- | --- | ---: | --- |");
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
  lines.push("", "## Deferred (not loaded in 2b-i)", "", "| entity | reason | count |", "| --- | --- | ---: |");
  const deferred = new Map<string, number>();
  for (const d of plan.deferred) deferred.set(`${d.entity}|${d.reason}`, (deferred.get(`${d.entity}|${d.reason}`) ?? 0) + 1);
  for (const [key, n] of [...deferred.entries()].sort()) {
    const [entity, reason] = key.split("|");
    lines.push(`| ${entity} | ${reason} | ${n} |`);
  }
  return `${lines.join("\n")}\n`;
}
