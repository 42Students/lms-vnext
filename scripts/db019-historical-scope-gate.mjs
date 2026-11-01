#!/usr/bin/env node
// DB19-P01/P02: source-field and live-code boundary gate for greenfield-retired
// legacy backup/Flyway/Smrithi tables. This does not certify PostgreSQL or
// the absence of consumers outside this repository.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reconcileDb00 } from "./db19-db00-disposition-crosscheck.mjs";

const OWNED = Object.freeze(["DB19-P01", "DB19-P02"]);
const CLASS_BY_PACKAGE = Object.freeze({
  "DB19-P01": new Set(["HISTORICAL_BACKUP_VALIDATE_RETIREMENT", "SCHEMA_TOOL_METADATA"]),
  "DB19-P02": new Set(["LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION"]),
});
const DISPOSITION_BY_CLASS = Object.freeze({
  HISTORICAL_BACKUP_VALIDATE_RETIREMENT: "RETIRE_GREENFIELD_BACKUP",
  SCHEMA_TOOL_METADATA: "REPLACED_BY_PLATFORM_MIGRATION_METADATA",
  LEGACY_SUBSYSTEM_NEEDS_PRODUCT_DECISION: "RETIRE_VNEXT_USER_APPROVED",
});
const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".sql"]);
const fieldId = (table, column) => table + "." + column;

export function inspectHistoricalPackages({ source, disposition, approval, packages, journal, runtimeFiles }) {
  const errors = [];
  const fail = (code, detail = null) => errors.push({ code, ...(detail ? { detail } : {}) });
  if (!source || !disposition || !approval || !Array.isArray(packages) ||
      !journal || !Array.isArray(runtimeFiles) || !Array.isArray(source.tables) ||
      !Array.isArray(disposition.tables)) {
    return { valid: false, sourceOnly: true, postgresVerified: false,
      errors: [{ code: "DB19_HISTORIC_INVALID_INPUT" }] };
  }
  const base = reconcileDb00(source, disposition, approval);
  if (!base.valid) fail("DB19_HISTORIC_ORIGINAL_DISPOSITION_INVALID", base.errors);
  const byTable = new Map(source.tables.map(t => [t.table, t]));
  const decisions = new Map(disposition.tables.map(t => [t.table, t]));
  const approvalByTable = new Map((approval.tables ?? []).map(t => [t.table, t]));
  const seenTables = new Set();
  const seenFields = new Set();
  const counts = {};
  for (const id of OWNED) {
    const matched = packages.filter(p => p?.id === id);
    if (matched.length !== 1) { fail("DB19_HISTORIC_PACKAGE_MISSING_OR_DUPLICATED", id); continue; }
    const p = matched[0];
    if (p.kind !== "DOMAIN" || p.domain !== "DB00" ||
        p.sourceInventory !== "docs/planning/db-pass4-columns-db00_historical_and_engine.json" ||
        !Array.isArray(p.sourceTables)) {
      fail("DB19_HISTORIC_PACKAGE_SCOPE_INVALID", id); continue;
    }
    let fields = 0;
    for (const name of p.sourceTables) {
      if (typeof name !== "string" || seenTables.has(name)) {
        fail("DB19_HISTORIC_DUPLICATE_PACKAGE_TABLE", name); continue;
      }
      seenTables.add(name);
      const table = byTable.get(name), decision = decisions.get(name);
      if (!table || !decision) { fail("DB19_HISTORIC_MISSING_TABLE_OR_DECISION", name); continue; }
      if (!CLASS_BY_PACKAGE[id].has(table.sourceTableClass) ||
          decision.disposition !== DISPOSITION_BY_CLASS[table.sourceTableClass])
        fail("DB19_HISTORIC_WRONG_TABLE_CLASS_OR_DISPOSITION", name);
      if (!Array.isArray(table.rows) || table.rows.length !== table.sourceFieldCount ||
          table.rows.length !== decision.sourceFieldCount)
        fail("DB19_HISTORIC_FIELD_COUNT_DRIFT", name);
      for (const field of table.rows ?? []) {
        const column = field?.legacyColumn;
        if (typeof column !== "string" || !column.trim() ||
            field.legacyTable !== name || field.legacySnapshotTable !== name ||
            typeof field.sourceType !== "string" || !field.sourceType ||
            typeof field.sourceDefinition !== "string" || !field.sourceDefinition ||
            !["NULL_ALLOWED", "NOT_NULL", "SOURCE_DEFAULT_NULLABILITY_REVIEW"].includes(field.nullable) ||
            !Array.isArray(field.riskFlags) ||
            !["CLASSIFY_HISTORIC_RETIREMENT", "UNVERIFIED_FIELD_SEMANTICS"].includes(field.reviewStatus)) {
          fail("DB19_HISTORIC_INVALID_SOURCE_FIELD", fieldId(name, String(column))); continue;
        }
        const key = fieldId(name, column);
        if (seenFields.has(key)) fail("DB19_HISTORIC_DUPLICATE_SOURCE_FIELD", key);
        seenFields.add(key);
      }
      if (id === "DB19-P02" &&
          (decision.productApprovalId !== approval.decisionId ||
           approvalByTable.get(name)?.sourceFieldCount !== table.rows.length))
        fail("DB19_HISTORIC_MISSING_PRODUCT_APPROVAL", name);
      fields += table.rows?.length ?? 0;
    }
    counts[id] = { tables: p.sourceTables.length, fields };
    if (p.sourceFieldCount !== fields) fail("DB19_HISTORIC_PACKAGE_FIELD_TOTAL_DRIFT", id);
  }
  if (seenTables.size !== source.tables.length ||
      source.tables.some(t => !seenTables.has(t.table)) ||
      seenFields.size !== source.counts?.fields ||
      seenFields.size !== 732 || counts["DB19-P01"]?.fields !== 641 ||
      counts["DB19-P02"]?.fields !== 91)
    fail("DB19_HISTORIC_GLOBAL_PARTITION_DRIFT");
  if (approval.legacyProductionMutationAuthorized !== false ||
      approval.dataMigrationRequired !== false ||
      approval.externalConsumerAbsenceProven !== false)
    fail("DB19_HISTORIC_APPROVAL_BOUNDARY_CHANGED");
  if (journal.dialect !== "postgresql" || !Array.isArray(journal.entries) ||
      journal.entries.length === 0 ||
      journal.entries.some((e, i) => e.idx !== i ||
        typeof e.tag !== "string" || !/^\d{4}_/.test(e.tag)))
    fail("DB19_HISTORIC_DRIZZLE_JOURNAL_MISSING_OR_INVALID");
  const livePaths = new Set(runtimeFiles.map(f => typeof f?.path === "string" ? f.path : ""));
  if (![...livePaths].some(f => f.startsWith("src/")) ||
      ![...livePaths].some(f => f.startsWith("drizzle/")))
    fail("DB19_HISTORIC_RUNTIME_SCAN_INCOMPLETE");
  const names = [...seenTables].sort((a, b) => b.length - a.length);
  let scanned = 0;
  for (const file of runtimeFiles) {
    if (typeof file?.path !== "string" || typeof file?.content !== "string") {
      fail("DB19_HISTORIC_RUNTIME_FILE_INVALID"); continue;
    }
    if (!(file.path.startsWith("src/") || file.path.startsWith("drizzle/"))) {
      fail("DB19_HISTORIC_RUNTIME_FILE_OUTSIDE_SCOPE", file.path); continue;
    }
    scanned++;
    for (const table of names) {
      const pattern = new RegExp("(^|[^A-Za-z0-9_])" +
        table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?=$|[^A-Za-z0-9_])", "m");
      if (pattern.test(file.content))
        fail("DB19_HISTORIC_LIVE_TABLE_REFERENCE", file.path + ":" + table);
    }
  }
  return { valid: errors.length === 0, sourceOnly: true, postgresVerified: false,
    verifiedAbsenceOfExternalConsumers: false, verifiedAbsenceOfLegacyRuntimeConsumers: false,
    scannedRuntimeFiles: scanned, counts, errors };
}

export function collectRuntimeFiles(root) {
  const out = [];
  const walk = (dir, prefix) => {
    if (!fs.existsSync(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isSymbolicLink()) continue;
      const full = path.join(dir, ent.name), relative = prefix + "/" + ent.name;
      if (ent.isDirectory()) walk(full, relative);
      else if (ent.isFile() && SCAN_EXT.has(path.extname(ent.name).toLowerCase()))
        out.push({ path: relative, content: fs.readFileSync(full, "utf8") });
    }
  };
  walk(path.join(root, "src"), "src");
  walk(path.join(root, "drizzle"), "drizzle");
  return out;
}

export function inspectCheckout(root) {
  const load = p => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
  const tracker = load("docs/tracker.json");
  const db19 = tracker.tasks.find(t => t.id === "DB-019");
  return inspectHistoricalPackages({
    source: load("docs/planning/db-pass4-columns-db00_historical_and_engine.json"),
    disposition: load("docs/planning/db00-historical-engine-disposition.json"),
    approval: load("docs/planning/db003-smrithi-vnext-scope-decision.json"),
    packages: db19?.workPlan?.packages ?? [],
    journal: load("drizzle/meta/_journal.json"),
    runtimeFiles: collectRuntimeFiles(root),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = process.argv[2] ? path.resolve(process.argv[2]) :
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
    const result = inspectCheckout(root);
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 2;
  } catch (e) { console.error(e); process.exitCode = 1; }
}
