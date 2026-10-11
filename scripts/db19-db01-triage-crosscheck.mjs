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

/**
 * Combine two already-existing DB01 *proposal* supplements (78 auth/
 * security rows and 150 remaining review rows) with the frozen 312-row
 * triage. This counts candidate coverage; it NEVER approves the target,
 * provider behavior, migrations, or PostgreSQL acceptance.
 */
export function reconcileDb01ProposalCoverage(triage, auth78, remaining150,
  {authNoTargetQueueBlobSha = null} = {}) {
  const errors = [];
  const src = Array.isArray(triage?.rows) ? triage.rows : [];
  const a = Array.isArray(auth78?.rows) ? auth78.rows : [];
  const b = Array.isArray(remaining150?.rows) ? remaining150.rows : [];
  const byKey = new Map(src.map(r=>[pathOf(r),r]));
  const unique = new Map();
  const tableSummary = {};
  let missing = 0;
  if(src.length!==312 || a.length!==78 || b.length!==150)
    errors.push({code:"SOURCE_PROPOSAL_CARDINALITY_DRIFT"});
  if(!/^[a-f0-9]{40}$/i.test(authNoTargetQueueBlobSha||"") ||
     auth78?.sourceQueueGitBlob!==authNoTargetQueueBlobSha)
    errors.push({code:"AUTH78_SOURCE_QUEUE_BLOB_DRIFT"});
  if(remaining150?.source?.legacyBackendSha!==triage?.sourceInventory?.legacyBackendSha)
    errors.push({code:"REMAINING150_ORACLE_DRIFT"});
  if(!validString(remaining150?.source?.blobSha))
    errors.push({code:"REMAINING150_MISSING_FROZEN_PROVENANCE"});
  const record=(key,proposal,source,sourceType,nullable,flags)=>{
    const live=byKey.get(key);
    if(!live){errors.push({code:"UNKNOWN_PROPOSAL_FIELD",key,source});return;}
    if(unique.has(key)){errors.push({code:"DUPLICATE_PROPOSAL",key,source});return;}
    if(sourceType&&sourceType!==live.sourceType || nullable&&nullable!==live.sourceNullable ||
       flags && JSON.stringify(flags)!==JSON.stringify(live.sourceRiskFlags??[]))
      errors.push({code:"PROPOSAL_SOURCE_SHAPE_DRIFT",key,source});
    if(proposal!==null&&!validString(proposal))
      errors.push({code:"INVALID_PROPOSAL_TARGET",key,source});
    if(proposal!=null&&live.candidateTarget!=null&&proposal!==live.candidateTarget)
      errors.push({code:"CONTRADICTING_FROZEN_TARGET",key,source,
        first:live.candidateTarget,second:proposal});
    unique.set(key,{source,target:proposal});
  };
  for(const row of a){
    const key=row.sourceField;
    const live=byKey.get(key);
    if(row.status!=="SOURCE_REVIEW_ONLY" || row.providerAccepted!==false ||
       row.postgresVerified!==false ||
       live && row.sourceActiveness!==live.postV150Active)
      errors.push({code:"FALSE_AUTH78_ACCEPTANCE",key});
    record(key,row.candidateTarget,"AUTH78",null,null,null);
  }
  for(const row of b){
    const key=row.legacy;
    if(row.decision!=="OPEN_NOT_ASSIGNED_OR_VERIFIED"||row.runtimeVerified!==false)
      errors.push({code:"FALSE_REMAINING150_ACCEPTANCE",key});
    record(key,row.candidateTarget,"REMAINING150",row.sourceType,row.sourceNullable,row.riskFlags);
  }
  const targetRows = new Set(src.filter(r=>r.candidateTarget!=null).map(pathOf));
  for(const [key,r] of unique){
    if(r.target!=null)targetRows.add(key);
    const table=key.split(".")[0];
    tableSummary[table]=(tableSummary[table]||0)+1;
  }
  missing=src.length-targetRows.size;
  if(unique.size!==228)errors.push({code:"INCOMPLETE_PROPOSAL_SWEEP",actual:unique.size});
  return {valid:errors.length===0,verification:"UNREGISTERED_TARGET_PROPOSALS_ONLY_NOT_POSTGRES",
    summary:{sourceRows:src.length,authProposals:a.length,remainingReviewRows:b.length,
      uniqueSupplementRows:unique.size,priorTriageTargetCandidates:src.filter(r=>r.candidateTarget!=null).length,
      supplementalTargetCandidates:[...unique].filter(([key,r])=>r.target!=null&&!byKey.get(key)?.candidateTarget).length,
      unionTargetCandidates:targetRows.size,withoutTargetCandidate:missing,
      runtimeAcceptedMappings:0,coveragePercent:Number((100*targetRows.size/src.length).toFixed(2)),
      bySupplementTable:tableSummary},errors};
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
