import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_SNAPSHOT_PARENT = "00000000-0000-0000-0000-000000000000";

/**
 * Source-level migration gate. It detects orphan/duplicate/out-of-order
 * migrations and broken Drizzle snapshot ancestry, *before* executing SQL.
 * It cannot prove SQL correctness or that Drizzle generated the snapshot.
 */
export function verifyDrizzleJournal(root = process.cwd()) {
  const folder = path.join(root, "drizzle");
  const meta = path.join(folder, "meta");
  const journalPath = path.join(meta, "_journal.json");
  const errors = [];
  if (!existsSync(journalPath)) throw new Error("Missing drizzle/meta/_journal.json");
  let journal;
  try { journal = JSON.parse(readFileSync(journalPath, "utf8")); }
  catch (error) { throw new Error("Invalid Drizzle journal JSON", { cause:error }); }

  if (!Array.isArray(journal.entries) || journal.entries.length === 0)
    throw new Error("Drizzle journal must contain at least one migration");

  if (journal.version !== "7" || journal.dialect !== "postgresql")
    errors.push("Journal version/dialect must match PostgreSQL Drizzle v7");

  const tags = new Set();
  const snapshotIds = new Set();
  let previousSnapshotId = null;
  let previousMigrationWhen = null;
  for (const [ordinal, entry] of journal.entries.entries()) {
    const prefix = String(ordinal).padStart(4, "0");
    if (entry.idx !== ordinal) errors.push(`Journal entry ${ordinal} has idx ${entry.idx}`);
    if (entry.version !== journal.version)
      errors.push(`Journal entry ${ordinal} has mismatched version ${entry.version}`);
    if (typeof entry.tag !== "string" ||
        !new RegExp(`^${prefix}_[A-Za-z0-9_]+$`).test(entry.tag))
      errors.push(`Entry ${ordinal} must have a matching zero-padded migration tag`);
    if (tags.has(entry.tag)) errors.push(`Duplicate journal tag ${entry.tag}`);
    tags.add(entry.tag);
    if (!Number.isSafeInteger(entry.when) || entry.when <= 0)
      errors.push(`Journal entry ${ordinal} has invalid timestamp`);
    else if (previousMigrationWhen !== null && entry.when <= previousMigrationWhen)
      errors.push(`Migration timestamp is not strictly increasing at ${entry.tag}`);
    if (Number.isSafeInteger(entry.when)) previousMigrationWhen = entry.when;

    const sqlPath = path.join(folder, entry.tag + ".sql");
    if (!existsSync(sqlPath)) errors.push(`Missing registered SQL: ${entry.tag}.sql`);
    else if (readFileSync(sqlPath, "utf8").trim().length === 0)
      errors.push(`Empty registered SQL: ${entry.tag}.sql`);

    const snapshotPath = path.join(meta, prefix + "_snapshot.json");
    if (!existsSync(snapshotPath)) {
      errors.push(`Missing snapshot: ${prefix}_snapshot.json`);
      continue;
    }
    let snapshot;
    try { snapshot = JSON.parse(readFileSync(snapshotPath, "utf8")); }
    catch { errors.push(`Invalid snapshot JSON: ${prefix}`); continue; }
    if (snapshot.version !== journal.version || snapshot.dialect !== journal.dialect)
      errors.push(`Snapshot ${prefix} version/dialect differs from journal`);
    if (typeof snapshot.id !== "string" || snapshot.id.length === 0)
      errors.push(`Snapshot ${prefix} has no id`);
    if (ordinal === 0 && snapshot.prevId !== ROOT_SNAPSHOT_PARENT)
      errors.push(`Root snapshot ${prefix} must point to Drizzle root sentinel`);
    if (snapshotIds.has(snapshot.id))
      errors.push(`Duplicate snapshot id: ${prefix}`);
    snapshotIds.add(snapshot.id);
    if (ordinal > 0 && snapshot.prevId !== previousSnapshotId)
      errors.push(`Broken snapshot ancestry at ${prefix}: expected ${previousSnapshotId}`);
    previousSnapshotId = snapshot.id;
  }

  const sqlNames = readdirSync(folder).filter(name => /^\d{4}_.+\.sql$/.test(name));
  for (const name of sqlNames) {
    if (!tags.has(name.slice(0, -4))) errors.push(`Unregistered migration SQL: ${name}`);
  }
  const snapshotNames = readdirSync(meta).filter(name => /^\d{4}_snapshot\.json$/.test(name));
  for (const name of snapshotNames) {
    const number = Number(name.slice(0,4));
    if (number >= journal.entries.length) errors.push(`Unregistered snapshot: ${name}`);
  }
  if (errors.length) throw new Error("Drizzle migration journal integrity failed:\n" +
    errors.map(error => " - " + error).join("\n"));

  return { migrations:journal.entries.length, first:journal.entries[0].tag,
    last:journal.entries.at(-1).tag };
}

const scriptPath = process.argv[1];
if (scriptPath && path.resolve(scriptPath) === fileURLToPath(import.meta.url)) {
  try {
    const result = verifyDrizzleJournal(process.cwd());
    process.stdout.write(`Migration journal source preflight: ${result.migrations} registered migrations (${result.first} → ${result.last}).\n`);
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  }
}
