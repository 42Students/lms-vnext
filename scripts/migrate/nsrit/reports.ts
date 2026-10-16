/**
 * Report writers for the NSRIT import. Everything here prints counts, reason
 * codes and masked references only; no names, phones, e-mails or free text.
 */
import type { Plan, Reason } from "./plan";

const ENTITY_ORDER = [
  "organization",
  "college",
  "department",
  "program",
  "batch",
  "academic_period",
  "class",
  "semester",
  "lecture_hall",
  "learner",
  "qualification",
  "faculty",
  "recruiter",
];

export function rejectionReportMarkdown(plan: Plan): string {
  const lines = ["# NSRIT rejected rows (masked)", ""];
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
  lines.push("", "## Deferred to stage 2b", "", "| entity | reason | count |", "| --- | --- | ---: |");
  const deferred = new Map<string, number>();
  for (const d of plan.deferred) {
    const key = `${d.entity}|${d.reason}`;
    deferred.set(key, (deferred.get(key) ?? 0) + 1);
  }
  for (const [key, n] of [...deferred.entries()].sort()) {
    const [entity, reason] = key.split("|");
    lines.push(`| ${entity} | ${reason} | ${n} |`);
  }
  return `${lines.join("\n")}\n`;
}

export function reviewListMarkdown(plan: Plan): string {
  const lines = [
    "# Shared phone/e-mail review list (masked)",
    "",
    "People sharing a phone or e-mail are never merged automatically. The loader loads the oldest account of a group and reports the rest as BLOCKED_DUPLICATE. Resolve by giving the blocked person a distinct phone/e-mail (or confirming they are one person) and re-run.",
    "",
  ];
  if (plan.review.length === 0) lines.push("No shared phone or e-mail groups among accepted accounts.");
  for (const group of plan.review) {
    lines.push(`## Group ${group.group} (shared ${group.basis.join(" + ") || "?"})`, "");
    lines.push("| ref | kind | name | phone | e-mail | outcome |", "| --- | --- | --- | --- | --- | --- |");
    for (const m of group.members) {
      lines.push(`| ${m.ref} | ${m.kind} | ${m.name} | ${m.phone} | ${m.email} | ${m.outcome} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export function reviewListCsv(plan: Plan): string {
  const rows = ["group,basis,ref,kind,name,phone,email,outcome"];
  for (const group of plan.review) {
    for (const m of group.members) {
      rows.push([group.group, group.basis.join("+"), m.ref, m.kind, m.name, m.phone, m.email, m.outcome].join(","));
    }
  }
  return `${rows.join("\n")}\n`;
}

export type LoadCounts = Record<string, { inserted: number; updated: number; unchanged: number }>;

export type Reconciliation = {
  mode: "dry-run" | "apply" | "rollback";
  batchId: string | null;
  snapshotSha256: string;
  loaderVersion: string;
  entities: {
    entity: string;
    legacy: number;
    planned: number;
    inserted: number;
    updated: number;
    unchanged: number;
    rejected: number;
    rejectedByReason: Partial<Record<Reason, number>>;
    blockedDuplicate: number;
    deferred: number;
  }[];
  loadedTables: LoadCounts;
  notes: Record<string, number>;
  validation: { check: string; ok: boolean; detail: string }[];
  timingsMs: Record<string, number>;
};

export function buildReconciliation(
  plan: Plan,
  loaded: LoadCounts,
  meta: Pick<Reconciliation, "mode" | "batchId" | "snapshotSha256" | "loaderVersion"> & {
    validation?: Reconciliation["validation"];
    timingsMs?: Record<string, number>;
  },
): Reconciliation {
  const tableOf: Record<string, string> = {
    organization: "organizations",
    college: "colleges",
    department: "departments",
    program: "programs",
    batch: "cohorts",
    academic_period: "academic_periods",
    class: "sections",
    semester: "program_terms",
    lecture_hall: "lecture_halls",
    learner: "users",
    faculty: "users",
  };
  const entities = ENTITY_ORDER.filter((e) => plan.stats[e]).map((entity) => {
    const s = plan.stats[entity];
    const rejected = Object.values(s.rejected).reduce((a, b) => a + (b ?? 0), 0);
    const table = tableOf[entity];
    // users are shared by learner/faculty; per-entity inserted counts come from planned only.
    const counts = table && entity !== "learner" && entity !== "faculty" ? loaded[table] : undefined;
    return {
      entity,
      legacy: s.legacy,
      planned: s.planned,
      inserted: counts?.inserted ?? 0,
      updated: counts?.updated ?? 0,
      unchanged: counts?.unchanged ?? 0,
      rejected,
      rejectedByReason: s.rejected,
      blockedDuplicate: s.blockedDuplicate,
      deferred: s.deferred,
    };
  });
  return {
    ...meta,
    entities,
    loadedTables: loaded,
    notes: plan.notes,
    validation: meta.validation ?? [],
    timingsMs: meta.timingsMs ?? {},
  };
}

export function reconciliationMarkdown(r: Reconciliation): string {
  const lines = [
    `# NSRIT stage 2a reconciliation (${r.mode})`,
    "",
    `batch: ${r.batchId ?? "-"}  snapshot: ${r.snapshotSha256.slice(0, 16)}  loader: ${r.loaderVersion}`,
    "",
    "| entity | legacy | planned | rejected | blocked dup | deferred |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const e of r.entities) {
    lines.push(`| ${e.entity} | ${e.legacy} | ${e.planned} | ${e.rejected} | ${e.blockedDuplicate} | ${e.deferred} |`);
  }
  lines.push("", "## Rejections by reason", "", "| entity | reason | count |", "| --- | --- | ---: |");
  for (const e of r.entities) {
    for (const [reason, n] of Object.entries(e.rejectedByReason)) lines.push(`| ${e.entity} | ${reason} | ${n} |`);
  }
  lines.push("", "## Target tables", "", "| table | inserted | updated | unchanged |", "| --- | ---: | ---: | ---: |");
  for (const [table, c] of Object.entries(r.loadedTables)) {
    lines.push(`| ${table} | ${c.inserted} | ${c.updated} | ${c.unchanged} |`);
  }
  lines.push("", "## Notes", "");
  for (const [k, v] of Object.entries(r.notes)) lines.push(`- ${k}: ${v}`);
  if (r.validation.length) {
    lines.push("", "## Validation", "");
    for (const v of r.validation) lines.push(`- ${v.ok ? "PASS" : "FAIL"} ${v.check}: ${v.detail}`);
  }
  if (Object.keys(r.timingsMs).length) {
    lines.push("", "## Timings (ms)", "");
    for (const [k, v] of Object.entries(r.timingsMs)) lines.push(`- ${k}: ${v}`);
  }
  return `${lines.join("\n")}\n`;
}
