/**
 * Reads the NSRIT snapshot (NDJSON + manifest.json) and verifies it. The
 * loader works ONLY from a verified snapshot: any missing file, row count
 * mismatch or sha256 mismatch aborts before the database is touched.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "./common";
import { snapshotDigest, type Manifest } from "./export-lib";
import type { Row } from "./mappers";

export class SnapshotIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotIntegrityError";
  }
}

export type Snapshot = {
  dir: string;
  manifest: Manifest;
  tables: Record<string, Row[]>;
};

export const REQUIRED_TABLES = [
  "organization",
  "college",
  "department",
  "new_program",
  "batch",
  "class",
  "semester",
  "lecture_hall",
  "learner",
  "qualification",
  "faculty",
  "recruiter",
  "recruiter_college_access",
  "company",
  "industry_company",
];

export function parseNdjson(text: string): Row[] {
  const rows: Row[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    rows.push(JSON.parse(line) as Row);
  }
  return rows;
}

export function readSnapshot(dir: string): Snapshot {
  const manifestPath = path.join(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new SnapshotIntegrityError("manifest.json is missing from the snapshot directory");
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
  if (manifest.format !== "nsrit-snapshot-1") {
    throw new SnapshotIntegrityError(`Unsupported snapshot format ${String(manifest.format)}`);
  }
  const tables: Record<string, Row[]> = {};
  for (const name of REQUIRED_TABLES) {
    const entry = manifest.tables[name];
    if (!entry) throw new SnapshotIntegrityError(`Snapshot has no table ${name}`);
    const file = path.join(dir, entry.file);
    if (!existsSync(file)) throw new SnapshotIntegrityError(`Snapshot file for ${name} is missing`);
    const buffer = readFileSync(file);
    if (sha256Hex(buffer) !== entry.sha256) {
      throw new SnapshotIntegrityError(`Manifest hash mismatch for ${name}: refusing to load`);
    }
    const rows = parseNdjson(buffer.toString("utf8"));
    if (rows.length !== entry.rows) {
      throw new SnapshotIntegrityError(`Manifest row count mismatch for ${name}`);
    }
    tables[name] = rows;
  }
  if (snapshotDigest(manifest.tables) !== manifest.snapshotSha256) {
    throw new SnapshotIntegrityError("Manifest digest mismatch: manifest was edited");
  }
  return { dir, manifest, tables };
}
