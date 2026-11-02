#!/usr/bin/env node
/**
 * Auto-generates DB19-PXX field review JSONs for unpicked packages.
 * Reads source inventory, Drizzle schema, and source modules to build
 * targetCandidate and producer/consumer candidates per field.
 *
 * Usage: node scripts/db019-generate-field-reviews.mjs [packageId]
 * e.g.:  node scripts/db019-generate-field-reviews.mjs DB19-P05
 *        node scripts/db019-generate-field-reviews.mjs all
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_SHA = "21bad59d4dfaf2fa11fdeaf9353327ce105697d5";

function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
}

// Load tracker to get package details
const tracker = readJson("docs/tracker.json");
const db019 = tracker.tasks.find(t => t.id === "DB-019");
const packages = db019.workPlan.packages;

// Load all schema files to build table→columns map
function buildSchemaMap() {
  const schemaDir = path.join(root, "src/db/schema");
  const map = new Map(); // tableName → [columnNames]
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".ts"));
  for (const f of files) {
    const content = fs.readFileSync(path.join(schemaDir, f), "utf8");
    // Extract table names from pgTable declarations
    const tableMatches = [...content.matchAll(/pgTable\(['"`]([^'"`]+)['"`]/g)];
    for (const tm of tableMatches) {
      const tableName = tm[1];
      if (!map.has(tableName)) map.set(tableName, []);
      // Extract column names: text('col_name'), uuid('col_name'), etc.
      const colMatches = [...content.matchAll(/\b\w+\(['"`]([a-z_][a-z0-9_]*)['"`]\)/g)];
      for (const cm of colMatches) {
        const col = cm[1];
        if (!col.startsWith("fk") && col.length > 1) {
          map.get(tableName).push(col);
        }
      }
    }
  }
  return map;
}

// Find vNext table candidates for a legacy table name
function findTargetTable(legacyTable, schemaMap) {
  const candidates = [];
  // Direct name match (snake_case similarity)
  const normalized = legacyTable.replace(/_/g, "");
  for (const [tbl] of schemaMap) {
    const tblNorm = tbl.replace(/_/g, "");
    if (tblNorm === normalized || tbl === legacyTable) {
      candidates.unshift(tbl); // exact match first
    } else if (tblNorm.includes(normalized) || normalized.includes(tblNorm)) {
      candidates.push(tbl);
    }
  }
  return candidates.slice(0, 3);
}

// Grep src/modules for files that reference a table name
function findProducersConsumers(tableName) {
  const modulesDir = path.join(root, "src/modules");
  try {
    // Look for the table name or snake_case variants
    const searchTerm = tableName.replace(/_/g, "[-_]?");
    const result = execSync(
      `grep -rl "${tableName}" "${modulesDir}" --include="*.ts" 2>/dev/null || true`,
      { encoding: "utf8", maxBuffer: 1024 * 1024 }
    ).trim();
    if (!result) return [];
    return result.split("\n")
      .filter(Boolean)
      .map(p => path.relative(root, p).replace(/\\/g, "/"))
      .slice(0, 5);
  } catch {
    return [];
  }
}

// Determine disposition based on source table class
function getDisposition(row, legacyTable) {
  const cls = row.sourceTableClass || "";
  if (cls.includes("RETIRED") || cls.includes("HISTORICAL")) {
    return "PROPOSED_RETIRED_NO_VNEXT_EQUIVALENT";
  }
  if (cls.includes("ENGINE") || cls.includes("MIGRATION")) {
    return "PROPOSED_ENGINE_METADATA_NO_RUNTIME_EQUIVALENT";
  }
  if (row.legacyColumn === "id") return "PROPOSED_NORMALIZED_UUID_PRIMARY_KEY";
  if (row.legacyColumn === "created_at") return "PROPOSED_NORMALIZED_AUDIT_TIMESTAMP";
  if (row.legacyColumn === "updated_at") return "PROPOSED_NORMALIZED_AUDIT_TIMESTAMP";
  if (row.legacyColumn === "is_deleted" || row.legacyColumn === "deleted_at") {
    return "PROPOSED_REDESIGNED_SOFT_DELETE_PATTERN";
  }
  if (row.riskFlags && row.riskFlags.includes("INTEGER_KEY_TO_UUID_MAPPING")) {
    return "PROPOSED_REGISTERED_WITH_UUID_NORMALIZATION";
  }
  return "PROPOSED_REGISTERED_ACTIVE_FIELD_BEHAVIOR";
}

function getSemanticRisk(row, legacyTable, targetCandidate) {
  const flags = row.riskFlags || [];
  const risks = [];
  if (flags.includes("INTEGER_KEY_TO_UUID_MAPPING")) {
    risks.push("Legacy numeric ID maps to UUID in vNext; no old-row import needed for greenfield.");
  }
  if (flags.includes("TIMEZONE_AND_DEADLINE_SEMANTICS")) {
    risks.push("Datetime(6) semantics differ from timestamptz; vNext stores UTC.");
  }
  if (flags.includes("PRECISION_ROUNDING")) {
    risks.push("Floating-point precision: vNext uses numeric/decimal for financial values.");
  }
  if (flags.includes("STRUCTURED_PAYLOAD_SEMANTIC_SCHEMA")) {
    risks.push("JSON payload: vNext uses typed JSONB or separate normalized columns.");
  }
  if (row.legacyColumn === "is_deleted") {
    risks.push("Soft-delete pattern replaced by status enum or archived_at timestamp in vNext.");
  }
  if (risks.length === 0) {
    risks.push(`Standard field mapping from legacy ${legacyTable} to ${targetCandidate || "vNext equivalent"}.`);
  }
  return risks.join(" ");
}

function generateFieldReview(pkg, schemaMap) {
  const inventoryPath = pkg.sourceInventory;
  const inventory = readJson(inventoryPath);

  // Get tables in scope for this package
  const pkgTables = new Set(pkg.sourceTables || []);
  const allTables = Array.isArray(inventory.tables) ? inventory.tables : [];
  const relevantTables = allTables.filter(t => pkgTables.has(t.table) || pkgTables.size === 0);

  if (relevantTables.length === 0) {
    console.warn(`  WARNING: No tables found for ${pkg.id} (${[...pkgTables].join(", ")})`);
    // Fall back to all tables in inventory if no match
    relevantTables.push(...allTables);
  }

  const fields = [];
  for (const table of relevantTables) {
    if (!pkgTables.has(table.table) && pkgTables.size > 0) continue;

    const targetCandidates = findTargetTable(table.table, schemaMap);
    const primaryTarget = targetCandidates[0] || table.table;
    const producers = findProducersConsumers(table.table);

    for (const row of (table.rows || [])) {
      const legacyCol = row.legacyColumn;
      const targetColCandidates = schemaMap.get(primaryTarget) || [];
      const targetCol = targetColCandidates.find(c => c === legacyCol)
        || targetColCandidates.find(c => c.includes(legacyCol.replace("_id", "").replace("is_", "")))
        || legacyCol;
      const targetCandidate = `${primaryTarget}.${targetCol}`;

      fields.push({
        sourceTable: row.legacyTable,
        sourceColumn: legacyCol,
        sourceType: row.sourceType || "unknown",
        sourceDefinition: row.sourceDefinition || "",
        sourceRiskFlags: row.riskFlags || [],
        targetCandidate,
        disposition: getDisposition(row, table.table),
        sourceVerifiedAtSha: LEGACY_SHA,
        exactRuntimeProducerCandidates: producers.filter(p => !p.includes("test")),
        exactRuntimeConsumerCandidates: producers.filter(p => !p.includes("test")),
        semanticRisk: getSemanticRisk(row, table.table, targetCandidate),
        approvedFinalDisposition: false,
        producerVerified: false,
        consumerVerified: false,
        runtimeVerified: false,
        retirementApproved: false,
      });
    }
  }

  return {
    id: pkg.id,
    recordType: "DB19_PACKAGE_SOURCE_FIELD_REVIEW",
    sourceSha: LEGACY_SHA,
    sourceInventory: inventoryPath,
    originalFieldLedger: inventoryPath.replace("db-pass4-columns-", "database-parity-").replace(".json", "-field-ledger.json"),
    sourceTables: pkg.sourceTables || [],
    sourceFieldCount: pkg.sourceFieldCount || fields.length,
    reviewedProposals: fields.length,
    runtimeVerifiedCount: 0,
    fieldDispositionApproval: "PENDING_PACKAGE_ACCEPTANCE",
    privacyBoundary: `${pkg.id} scoped source field disposition only. Global P31/P32 and DB020 remain open.`,
    testEvidenceStatus: "SOURCE_QUALITY_GATE_ONLY_NOT_RUNTIME_CERTIFIED",
    pendingAcceptance: `Registered PG17 producer/consumer and runtime verification for all ${fields.length} fields.`,
    fields,
  };
}

async function main() {
  const targetId = process.argv[2] || "all";
  const schemaMap = buildSchemaMap();
  console.log(`Schema loaded: ${schemaMap.size} tables`);

  const unpickedPackages = packages.filter(p =>
    !p.done && !p.picked &&
    (targetId === "all" || p.id === targetId) &&
    p.kind !== "GATE"
  );

  if (unpickedPackages.length === 0) {
    console.log("No unpicked non-gate packages found for:", targetId);
    return;
  }

  for (const pkg of unpickedPackages) {
    console.log(`\nGenerating field review for ${pkg.id}: ${pkg.title}`);
    console.log(`  Tables: ${(pkg.sourceTables || []).join(", ")}`);

    try {
      const review = generateFieldReview(pkg, schemaMap);
      const outPath = path.join(
        root,
        "docs/planning",
        `db019-${pkg.id.toLowerCase().replace("db19-", "")}-field-review.json`
      );
      fs.writeFileSync(outPath, JSON.stringify(review, null, 2) + "\n");
      console.log(`  Written: ${outPath.replace(root + path.sep, "")} (${review.fields.length} fields)`);
    } catch (err) {
      console.error(`  ERROR for ${pkg.id}:`, err.message);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
