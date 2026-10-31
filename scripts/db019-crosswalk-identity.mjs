#!/usr/bin/env node
// DB-019 crosswalk identity and immutable-inventory check. SOURCE ONLY.
// A field identity match never proves semantic equivalence or PostgreSQL acceptance.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {loadDb019SemanticDecisions} from "./db019-semantic-decision-quality.mjs";
import {loadProjectRegisteredHistory} from "./db019-project-registered-history.mjs";

export const CROSSWALKS = Object.freeze({
  DB01: ["db01_identity_and_tenancy", "db01-chat02-312-field-source-triage.json"],
  DB03: ["db03_groups_and_electives", "database-parity-db03-79-field-crosswalk.json"],
  DB04: ["db04_profiles_and_verification", "db04-field-crosswalk-proposals.json"],
  DB05: ["db05_courses_and_content", "db05-chat06-source-semantic-review.json"],
  DB06: ["db06_assessments_and_attendance", "database-parity-db06-field-reconciliation.json"],
  DB07: ["db07_projects", "db07-w03-field-review.json"],
  DB08: ["db08_placement_policy_and_outcomes", "database-parity-db08-field-ledger.json"],
  DB09: ["db09_tpo_and_recruiter_operations", "database-parity-db09-field-ledger.json"],
  DB10: ["db10_shared_operations", "database-parity-db10-field-ledger.json"],
});
const key = (table, column) => (typeof table === "string" && typeof column === "string" &&
  table.trim() && column.trim()) ? table + "." + column : null;
const collect = (arr, selector, errors, prefix) => {
  if (!Array.isArray(arr)) { errors.push({code: "INVALID_" + prefix + "_COLLECTION"}); return []; }
  return arr.map(selector).map((value, i) => {
    if (!value) errors.push({code: "INVALID_" + prefix + "_IDENTITY", index: i});
    return value;
  }).filter(Boolean);
};
const flatten = (tables, columnProp, errors) => {
  if (!Array.isArray(tables)) { errors.push({code:"INVALID_CROSSWALK_TABLES"}); return []; }
  return tables.flatMap(t => collect(t.fields, row => key(t.legacyTable, row?.[columnProp]),
    errors, "CROSSWALK"));
};
export function reconcileCrosswalk(domain, ledger, artifact, inventoryBlobSha = null) {
  const config = CROSSWALKS[domain], errors = [];
  if (!config) throw Error("Unknown domain " + domain);
  if (!ledger || ledger.domain !== config[0].toUpperCase() || !Array.isArray(ledger.tables)) {
    return {domain, sourceOnly:true, databaseVerified:false, errors:[{code:"INVALID_OR_WRONG_LEDGER"}]};
  }
  if (!artifact || typeof artifact !== "object")
    return {domain, sourceOnly:true, databaseVerified:false, errors:[{code:"INVALID_CROSSWALK"}]};
  const sourceRows = ledger.tables
    .filter(t => domain !== "DB06" || t.sourceDisposition === "ACTIVE_SOURCE_CONTRACT")
    .flatMap(t => collect(t.rows, row => key(t.table, row?.legacyColumn), errors, "SOURCE"));
  let targetRows;
  if (["DB01","DB04","DB07","DB09","DB10"].includes(domain))
    targetRows = collect(artifact.records ?? artifact.rows,
      row => key(row?.legacyTable, row?.legacyColumn), errors, "CROSSWALK");
  else if (domain === "DB03")
    targetRows = collect(artifact.fields, row => row?.legacyColumn, errors, "CROSSWALK");
  else if (domain === "DB05")
    targetRows = collect(artifact.fields, row => row?.source, errors, "CROSSWALK");
  else if (domain === "DB06")
    targetRows = flatten(artifact.tables, "legacyField", errors);
  else
    targetRows = flatten(artifact.tables, "legacyColumn", errors);
  const occurrence = rows => {
    const seen = new Set(), duplicate = new Set();
    for (const row of rows) { if (seen.has(row)) duplicate.add(row); seen.add(row); }
    return {seen, duplicate:[...duplicate].sort()};
  };
  const src = occurrence(sourceRows), dst = occurrence(targetRows);
  const missing = [...src.seen].filter(k => !dst.seen.has(k)).sort();
  const extra = [...dst.seen].filter(k => !src.seen.has(k)).sort();
  if (src.duplicate.length) errors.push({code:"DUPLICATE_SOURCE_FIELDS", fields:src.duplicate});
  if (dst.duplicate.length) errors.push({code:"DUPLICATE_CROSSWALK_FIELDS", fields:dst.duplicate});
  if (missing.length) errors.push({code:"CROSSWALK_MISSING_FIELDS", fields:missing});
  if (extra.length) errors.push({code:"CROSSWALK_EXTRA_FIELDS", fields:extra});
  // Crosswalk formats store the frozen backend oracle and inventory pin in
  // different locations. Checking only a top-level sourceSha would silently
  // bypass DB01/DB03/DB08 source-drift detection.
  const sourceSha = artifact.sourceSha || artifact.legacyBackendSha || artifact.legacyOracleSha ||
    artifact.source?.legacyBackendSha || artifact.sourceInventory?.legacyBackendSha ||
    artifact.capturedFrom?.legacyBackendSha || null;
  if (!/^[a-f0-9]{40}$/i.test(sourceSha || ""))
    errors.push({code:"MISSING_LEGACY_SOURCE_SHA", domain});
  else if (sourceSha !== ledger.sourceSha)
    errors.push({code:"LEGACY_SOURCE_SHA_DRIFT", expected:ledger.sourceSha, observed:sourceSha});
  const pin = artifact.source?.inventoryBlobSha || artifact.sourceInventory?.blobSha || null;
  if (pin && (!/^[a-f0-9]{40}$/i.test(inventoryBlobSha || "") || pin !== inventoryBlobSha))
    errors.push({code:"INVENTORY_BLOB_SHA_DRIFT", pinned:pin, observed:inventoryBlobSha});
  return {domain, sourceOnly:true, databaseVerified:false,
    sourceFields:sourceRows.length, crosswalkFields:targetRows.length,
    excludedHistoricalSourceFields:domain === "DB06" ? ledger.tables
      .filter(t => t.sourceDisposition !== "ACTIVE_SOURCE_CONTRACT")
      .reduce((sum,t) => sum + (t.rows?.length || 0),0) : 0,
    pinChecked:Boolean(pin), missing, extra, duplicateSource:src.duplicate,
    duplicateCrosswalk:dst.duplicate, errors};
}
export function gitBlobSha(bytes) {
  const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return createHash("sha1").update(Buffer.from("blob " + data.length + "\0")).update(data).digest("hex");
}
export function reconcileCheckout(root) {
  const domains=[];
  for (const [domain,[suffix,artifactName]] of Object.entries(CROSSWALKS)) {
    const ledgerPath = path.join(root,"docs/planning/db-pass4-columns-" + suffix + ".json");
    const bytes = fs.readFileSync(ledgerPath);
    const ledger = JSON.parse(bytes.toString("utf8"));
    const artifact = JSON.parse(fs.readFileSync(path.join(root,"docs/planning",artifactName),"utf8"));
    domains.push(reconcileCrosswalk(domain,ledger,artifact,gitBlobSha(bytes)));
  }
  const semanticDecisionQuality = loadDb019SemanticDecisions(root);
  const projectRegisteredHistory = loadProjectRegisteredHistory(root);
  return {kind:"DB019_SOURCE_CROSSWALKS_ONLY_NOT_POSTGRES_ACCEPTANCE",
    databaseVerified:false,domains,comparedFields:domains.reduce((s,d)=>s+(d.sourceFields||0),0),
    semanticDecisionQuality,projectRegisteredHistory,
    errors:[...domains.flatMap(d=>d.errors.map(error=>({domain:d.domain,...error}))),
      ...semanticDecisionQuality.errors.map(error=>({domain:"DB02_DB07_DB09_QUALITY",...error})),
      ...projectRegisteredHistory.errors.map(error=>({domain:"DB07_REGISTERED_HISTORY",...error}))]};
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const root=process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
    const result=reconcileCheckout(root); console.log(JSON.stringify(result,null,2));
    if (result.errors.length) process.exitCode=2;
  } catch(error) { console.error(error); process.exitCode=1; }
}
