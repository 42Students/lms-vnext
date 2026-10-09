import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Read-only source/metadata diagnostics. Does not connect to production or modify a DB.
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const json = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sorted = (items) => items.sort((a, b) => a.localeCompare(b));

export function classifyJava(source, file) {
  const kind = /@Entity\b/.test(source) ? "ENTITY" :
    /@MappedSuperclass\b/.test(source) ? "MAPPED_SUPERCLASS" :
    /@Embeddable\b/.test(source) ? "EMBEDDABLE" :
    /@Converter\b/.test(source) ? "CONVERTER" : "OTHER_OR_UNRESOLVED";
  const table = /@Table\s*\([\s\S]*?\bname\s*=\s*"([^"]+)"/.exec(source)?.[1] ?? null;
  const className = /\b(?:class|record|enum|interface)\s+([A-Za-z_]\w*)/.exec(source)?.[1] ?? path.basename(file, ".java");
  const superclass = /\bclass\s+\w+\s+extends\s+([A-Za-z_]\w*)/.exec(source)?.[1] ?? null;
  const fields = [];
  // Candidate extraction, not a Hibernate physical-column resolver. Includes embedded and inherited caveats.
  const fieldRegex = /(?:^|\n)((?:\s*@[A-Z][\s\S]*?\n)*?)\s*(?:private|protected|public)\s+(?!static\b)(?!final\b)([A-Za-z_][\w<>,.?\[\] ]*)\s+([A-Za-z_]\w*)\s*(?:;|=\s*[^;\n]*;)/g;
  for (const match of source.matchAll(fieldRegex)) {
    const anno = match[1] ?? "";
    const name = match[3];
    const type = match[2].trim();
    if (!type || /\b(class|interface|return)\b/.test(type) || fields.some(x => x.name === name)) continue;
    fields.push({
      name,
      javaType: type,
      columnAnnotation: /@Column\s*\([\s\S]*?\bname\s*=\s*"([^"]+)"/.exec(anno)?.[1] ?? null,
      joinColumnAnnotation: /@JoinColumn\s*\([\s\S]*?\bname\s*=\s*"([^"]+)"/.exec(anno)?.[1] ?? null,
      annotations: [...anno.matchAll(/@([A-Z][A-Za-z0-9_]*)/g)].map(m => m[1]),
    });
  }
  return { file, className, kind, table, superclass, candidateFields: fields };
}

export function listFiles(folder, filter = () => true) {
  const out = [];
  if (!fs.existsSync(folder)) return out;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const p = path.join(folder, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(p, filter));
    else if (entry.isFile() && filter(p)) out.push(p);
  }
  return sorted(out);
}

export function parseMigrationImpact(file, source) {
  const names = new Set();
  const patterns = [
    /\bCREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([a-z_][\w]*)/gi,
    /\bALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"]?([a-z_][\w]*)/gi,
    /\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"]?([a-z_][\w]*)/gi,
    /\bRENAME\s+TABLE\s+[`"]?([a-z_][\w]*)/gi,
  ];
  for (const pattern of patterns) for (const m of source.matchAll(pattern)) names.add(m[1]);
  const n = /(?:^|\/)V(\d+)(?:_(\d+))?__/.exec(file);
  return {
    file, version: n ? Number(n[1]) : null, minorVersion: n?.[2] ? Number(n[2]) : null,
    mentionedTables: sorted([...names]),
    operations: {
      createTable: /\bCREATE\s+TABLE\b/i.test(source),
      alterTable: /\bALTER\s+TABLE\b/i.test(source),
      dropTable: /\bDROP\s+TABLE\b/i.test(source),
      renameTable: /\bRENAME\s+TABLE\b/i.test(source),
    },
    warning: "SQL regex candidates only. Comments, dynamic SQL, procedures and Hibernate ddl-auto=update require physical-schema verification.",
  };
}

export function makeLegacySourceCensus(legacyRoot) {
  const javaDir = path.join(legacyRoot, "src/main/java");
  const migDir = path.join(legacyRoot, "src/main/resources/db/migration");
  const javaFiles = listFiles(javaDir, p => p.endsWith(".java"));
  const candidates = javaFiles.map(f => classifyJava(fs.readFileSync(f, "utf8"), path.relative(legacyRoot, f).replaceAll(path.sep, "/")));
  const migrations = listFiles(migDir, p => /V\d+.*\.sql$/i.test(p))
    .map(f => parseMigrationImpact(path.relative(legacyRoot, f).replaceAll(path.sep, "/"), fs.readFileSync(f, "utf8")))
    .sort((a, b) => (a.version ?? Infinity) - (b.version ?? Infinity) || (a.minorVersion ?? 0) - (b.minorVersion ?? 0) || a.file.localeCompare(b.file));
  return {
    sourceRoot: legacyRoot, counts: {
      allJavaFiles: javaFiles.length,
      annotatedEntities: candidates.filter(c => c.kind === "ENTITY").length,
      candidateModelFields: candidates.filter(c => c.kind === "ENTITY").reduce((s, c) => s + c.candidateFields.length, 0),
      migrationSqlFiles: migrations.length,
    }, entities: candidates.filter(c => c.kind !== "OTHER_OR_UNRESOLVED"), migrations,
    warnings: [
      "Do not equate JPA entities and physical tables.",
      "Legacy has simultaneous Flyway and Hibernate ddl-auto=update; read-only live information_schema export is mandatory.",
      "Resolve @MappedSuperclass inheritance, field access, converters, naming strategies, and DDL changes before closing field mappings.",
    ],
  };
}

export function parseLegacyJsonl(source) {
  const lines = source.split(/\r?\n/).filter(x => x.trim());
  return lines.map((line, i) => {
    try { const o = JSON.parse(line); if (!o || typeof o !== "object" || !o.kind) throw Error("missing kind"); return o; }
    catch (error) { throw Error("Invalid legacy schema JSON on line " + (i + 1) + ": " + String(error)); }
  });
}

export function summarizePhysical(records, mappings, vnextTables) {
  const tables = records.filter(r => r.kind === "table" && r.table_type === "BASE TABLE");
  const fields = records.filter(r => r.kind === "column");
  const target = new Set(vnextTables.map(t => t.name));
  const indexed = new Map(mappings.map(m => [m.legacyTable, m]));
  const seen = new Set(tables.map(t => t.table_name));
  const unmappedTables = tables.map(t => t.table_name).filter(n => !indexed.has(n));
  const nonimplementedTables = tables.map(t => t.table_name)
    .filter(n => indexed.has(n) && !indexed.get(n).vnextTable);
  const danglingTargetMappings = mappings.filter(m => m.vnextTable && !target.has(m.vnextTable))
    .map(m => ({ legacyTable: m.legacyTable, vnextTable: m.vnextTable }));
  const sourceMissingMappings = mappings.filter(m => !seen.has(m.legacyTable))
    .map(m => m.legacyTable);
  // Table mappings do NOT close any field-level relationship or state parity.
  return {
    legacyPhysicalTables: tables.length, legacyPhysicalColumns: fields.length,
    sourceMappedTables: tables.length - unmappedTables.length,
    unmappedTables, nonimplementedTables, danglingTargetMappings, sourceMissingMappings,
    unresolvedFieldMappings: fields.length,
    canClaimParity: false,
    warning: "Table mapping by itself never verifies fields, foreign keys, uniqueness, defaults, state history or workflow parity.",
  };
}

export function run(argv = process.argv.slice(2)) {
  const cmd = argv[0] ?? "status";
  const value = name => { const idx = argv.indexOf(name); return idx < 0 ? undefined : argv[idx + 1]; };
  if (cmd === "inventory") {
    const legacyRoot = value("--legacy-root");
    if (!legacyRoot) throw Error("inventory requires --legacy-root PATH of checked-out legacy repository");
    const result = makeLegacySourceCensus(path.resolve(legacyRoot));
    if (value("--output")) fs.writeFileSync(path.resolve(value("--output")), JSON.stringify(result, null, 2) + "\n");
    else process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }
  const manifest = json(path.join(defaultRoot, "docs/planning/database-parity-source-inventory.json"));
  const mappings = json(path.join(defaultRoot, "docs/planning/database-parity-table-crosswalk.json"));
  if (cmd === "compare") {
    const legacy = value("--legacy-jsonl");
    if (!legacy) throw Error("compare requires --legacy-jsonl PATH; do not infer physical schema from migrations");
    const report = summarizePhysical(parseLegacyJsonl(fs.readFileSync(legacy, "utf8")), mappings.tables, manifest.vnextSnapshotTables);
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    if (report.unmappedTables.length || report.nonimplementedTables.length || report.danglingTargetMappings.length) process.exitCode = 2;
  } else if (cmd === "status") {
    const report = { baseline: manifest.baseline, sourceCounts: manifest.summaries,
      legacyTableCrosswalkEntries: mappings.tables.length,
      implementedLegacyTableMappings: mappings.tables.filter(m => m.vnextTable && m.state === "MAPPED_PENDING_FIELD_AUDIT").length,
      explicitMissingLegacyConcepts: mappings.tables.filter(m => m.state === "GAP_CONFIRMED").map(m => m.legacyTable),
      physicalLegacySchemaAvailable: false, parityVerified: false };
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else throw Error("Unknown command: " + cmd);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { run(); } catch (e) { process.stderr.write(String(e) + "\n"); process.exitCode = 1; }
}
