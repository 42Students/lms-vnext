#!/usr/bin/env node
// DB01/DB19: source-activity review coverage. NOT database/API parity.
// Preserve the exact archived 312-field source ledger and its Git blob pin.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pathOf = row => row.legacyTable + "." + row.legacyColumn;
export const TRIAGE_PATH = "docs/planning/db01-chat02-312-field-source-triage.json";
export const INVENTORY_PATH = "docs/planning/db-pass4-columns-db01_identity_and_tenancy.json";
const validString = v => typeof v === "string" && v.trim().length > 0;
export const gitBlobSha = input => {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return createHash("sha1").update(Buffer.from("blob " + bytes.length + "\0")).update(bytes).digest("hex");
};

export function reconcileDb01Triage(inventory, triage, { inventoryBlobSha = null } = {}) {
  const errors = [], statuses = {}, categories = {};
  const primary = Array.isArray(inventory?.tables) ? inventory.tables.flatMap(t => t.rows ?? []) : [];
  const reviewed = Array.isArray(triage?.rows) ? triage.rows : [];
  const byKey = new Map(), found = new Set();
  const summary = { inventoryFields: primary.length, reviewedFields: 0, sourceActiveFields: 0,
    sourceExceptionFields: 0, targetCandidatesUnverified: 0, withoutTargetDecision: 0,
    activeFieldsWithEvidence: 0, activeFieldsNeedingConsumerProof: 0,
    runtimeVerified: 0, sourceActivenessStatuses: statuses, categories };
  if (triage?.sourceInventory?.path !== INVENTORY_PATH)
    errors.push({code:"SOURCE_PATH_DRIFT"});
  // An omitted hash is NOT authorization to skip the immutable source
  // proof. Callers must supply the exact Git blob digest from raw bytes.
  if (!/^[a-f0-9]{40}$/i.test(inventoryBlobSha || "") ||
      !validString(triage?.sourceInventory?.blobSha) ||
      triage.sourceInventory.blobSha !== inventoryBlobSha)
    errors.push({code:"PINNED_INVENTORY_BLOB_DRIFT"});
  if (triage?.sourceInventory?.legacyBackendSha !== inventory?.sourceSha)
    errors.push({code:"LEGACY_ORACLE_DRIFT"});
  if (inventory?.counts?.fields !== primary.length ||
      inventory?.counts?.tables !== inventory?.tables?.length ||
      triage?.summary?.candidateFields !== reviewed.length ||
      triage?.summary?.candidateTables !== inventory?.tables?.length ||
      reviewed.length !== primary.length)
    errors.push({code:"INVENTORY_CARDINALITY_DRIFT"});

  for (const row of primary) {
    const key = pathOf(row);
    if (byKey.has(key)) errors.push({code:"DUPLICATE_PRIMARY",key});
    byKey.set(key,row);
  }
  for (const row of reviewed) {
    const key = pathOf(row), source = byKey.get(key);
    if (found.has(key)) { errors.push({code:"DUPLICATE_TRIAGE",key}); continue; }
    found.add(key);
    if (!source) { errors.push({code:"UNRECOGNIZED_TRIAGE_FIELD",key}); continue; }
    if (row.sourceType !== source.sourceType ||
        row.sourceNullable !== source.nullable ||
        JSON.stringify(row.sourceRiskFlags ?? []) !== JSON.stringify(source.riskFlags ?? []))
      errors.push({code:"SOURCE_SHAPE_DRIFT",key});
    if (!validString(row.postV150Active) || !validString(row.category) ||
        !validString(row.rationaleOrBlocker) ||
        row.reviewStatus !== "SOURCE_TRIAGE_ONLY_NOT_RUNTIME_VERIFIED")
      errors.push({code:"UNSUPPORTED_SOURCE_CLASSIFICATION",key});
    if (row.verificationEvidence != null || source.verifiedMapping != null ||
        source.validationEvidence != null)
      errors.push({code:"FALSE_RUNTIME_ACCEPTANCE",key});
    if (row.candidateTarget != null && !validString(row.candidateTarget))
      errors.push({code:"INVALID_TARGET_CANDIDATE",key});
    if (!validString(row.postV150Active) || !validString(row.category)) continue;
    summary.reviewedFields++;
    statuses[row.postV150Active] = (statuses[row.postV150Active]||0)+1;
    categories[row.category] = (categories[row.category]||0)+1;
    if (row.postV150Active.startsWith("ACTIVE_")) summary.sourceActiveFields++;
    else summary.sourceExceptionFields++;
    if (row.candidateTarget !== null) summary.targetCandidatesUnverified++;
    else summary.withoutTargetDecision++;
    if (row.postV150Active.startsWith("ACTIVE_")) {
      if (row.postV150Evidence?.length || validString(row.postV150EvidenceSummary))
        summary.activeFieldsWithEvidence++;
      else
        // Source classification is present but not proof of a current
        // consumer. Track the gap honestly; don't invent a code citation.
        summary.activeFieldsNeedingConsumerProof++;
    }
  }
  for (const key of byKey.keys())
    if (!found.has(key)) errors.push({code:"MISSING_SOURCE_DISPOSITION",key});
  if (summary.reviewedFields !== primary.length)
    errors.push({code:"INCOMPLETE_DB01_ACTIVITY_REVIEW"});
  return { valid: errors.length === 0,
    verification:"FROZEN_SOURCE_ACTIVITY_REVIEW_ONLY_NOT_RUNTIME_VERIFIED",
    summary, errors };
}
export function auditDb01TriageCheckout(root) {
  const original = readFileSync(resolve(root,INVENTORY_PATH));
  const triage = JSON.parse(readFileSync(resolve(root,TRIAGE_PATH),"utf8"));
  return reconcileDb01Triage(JSON.parse(original.toString("utf8")),triage,
    {inventoryBlobSha:gitBlobSha(original)});
}
if (process.argv[1] && import.meta.url === new URL("file://"+resolve(process.argv[1])).href) {
  try {
    const report = auditDb01TriageCheckout(process.argv[2] || process.cwd());
    console.log(JSON.stringify(report,null,2));
    if(!report.valid)process.exitCode=2;
  } catch(e){console.error(e);process.exitCode=1;}
}
