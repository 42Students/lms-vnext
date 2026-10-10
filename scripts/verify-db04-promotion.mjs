import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const pairs = [
  ["profileVerifications", "profile_verifications"],
  ["profileVerificationEvents", "profile_verification_events"],
  ["profilePrivateDocumentReceipts", "profile_private_document_receipts"],
  ["profileVerificationSettings", "profile_verification_settings"],
  ["profileVerificationTpoGrants", "profile_verification_tpo_grants"],
  ["profileVerificationAcademicMarks", "profile_verification_academic_marks"],
];

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!existsSync(file)) throw new Error("Missing required DB04 source: " + relative);
  return readFileSync(file, "utf8");
}

const schema = read("src/db/schema/profile-verification.ts");
const index = read("src/db/schema/index.ts");
const candidate = read("docs/planning/db04-proposed-migration.sql");
const storage = read("src/modules/storage/private-object-storage.ts");
const verifier = read("src/modules/profile-verification/gcs-private-receipts.ts");
const profiles = read("src/db/schema/profiles.ts");
const facultyDocument = read("src/modules/people/faculty-profile-document.ts");
const facultyAdapter = read("src/modules/people/faculty-profile-self.staged.ts");
const facultySql = read("docs/planning/sql/db04-faculty-profile-document-staging.sql");
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const errors = [];

for (const [symbol, table] of pairs) {
  if (!schema.includes("export const " + symbol + " = pgTable(\"" + table + "\"")) {
    errors.push("Drizzle model missing: " + table);
  }
  if (!candidate.toLowerCase().includes("create table " + table)) {
    errors.push("Candidate SQL table missing: " + table);
  }
}

for (const token of [
  "profile_verification_academic_marks_parent_fk",
  "db04_profile_verification_events_immutable",
  "db04_profile_verifications_revision",
  "profile_verifications_id_member_uq",
]) {
  if (!candidate.includes(token)) errors.push("Candidate SQL invariant missing: " + token);
}

for (const token of [
  "profile_document jsonb",
  "profile_document_version integer",
  "faculty_profiles_profile_document_object_ck",
  "faculty_profiles_profile_document_version_ck",
]) {
  if (!facultySql.includes(token)) errors.push("Faculty profile staged SQL invariant missing: " + token);
}

for (const token of [
  "facultyProfileDocumentSchema",
  "profileImageDocumentId",
  "aadhaarLast4",
  "panMasked",
  "publications",
  "awards",
]) {
  if (!facultyDocument.includes(token)) errors.push("Faculty profile document invariant missing: " + token);
}
if (facultyDocument.includes("resumeDocumentId")) {
  errors.push("Faculty profile document must not add learner-only Resume parity");
}

for (const token of [
  "assertPersistedPlatformPermission",
  '"profile.self.manage"',
  '"FACULTY_PROFILE_VERSION_CONFLICT"',
  "profile_document_version",
  "for update",
]) {
  if (!facultyAdapter.includes(token)) errors.push("Faculty profile staged adapter invariant missing: " + token);
}

for (const token of [
  "PRIVATE_STORAGE_BUCKET_UNSAFE",
  "publicAccessPrevention",
  "malware_scan_status",
  "scan_attested_by",
]) {
  if (!storage.includes(token)) errors.push("Private storage invariant missing: " + token);
}

for (const token of [
  "uniformBucketLevelAccess",
  "publicAccessPrevention",
  "lms-vnext-privileged-scanner",
  "objectGeneration",
]) {
  if (!verifier.includes(token)) errors.push("GCS receipt invariant missing: " + token);
}

const exported =
  index.includes('export * from "./profile-verification"') ||
  index.includes("export * from './profile-verification'");
const entries = Array.isArray(journal.entries) ? journal.entries : [];
const registered = entries.filter((entry) =>
  typeof entry?.tag === "string" && entry.tag.toLowerCase().includes("db04"),
);

const facultyColumnsActive =
  profiles.includes('profileDocument: jsonb("profile_document")') &&
  profiles.includes('profileDocumentVersion: integer("profile_document_version")');

if (!exported) {
  if (registered.length) errors.push("DB04 is journal-registered while its schema barrel export is absent");
  if (facultyColumnsActive) errors.push("Faculty profile DB04 columns are active before DB04 migration registration");
  const drizzleDir = path.join(ROOT, "drizzle");
  for (const name of readdirSync(drizzleDir).filter((name) => name.endsWith(".sql"))) {
    const sql = readFileSync(path.join(drizzleDir, name), "utf8");
    if (pairs.some(([, table]) => sql.includes(table))) {
      errors.push("DB04 table found in active migration while schema remains staged: " + name);
    }
  }
} else {
  if (registered.length !== 1) {
    errors.push("Expected exactly one registered DB04 migration after schema export");
  } else {
    const entry = registered[0];
    const prefix = String(entry.idx).padStart(4, "0");
    const sqlFile = path.join(ROOT, "drizzle", entry.tag + ".sql");
    const snapshotFile = path.join(ROOT, "drizzle/meta", prefix + "_snapshot.json");
    if (!existsSync(sqlFile)) errors.push("Registered DB04 SQL file is missing");
    if (!existsSync(snapshotFile)) errors.push("Registered DB04 snapshot is missing");
    if (existsSync(sqlFile)) {
      const sql = readFileSync(sqlFile, "utf8");
      for (const [, table] of pairs) {
        if (!sql.includes(table)) errors.push("Registered DB04 SQL missing table: " + table);
      }
      if (!sql.includes("profile_document_version")) {
        errors.push("Registered DB04 SQL missing Faculty profile document columns");
      }
    }
  }
  if (!facultyColumnsActive) {
    errors.push("DB04 is registered but Faculty profile document columns are absent from profiles.ts");
  }
}

if (errors.length) {
  throw new Error("DB04 promotion preflight failed:\n - " + errors.join("\n - "));
}

process.stdout.write(
  "DB04 promotion preflight: " +
    (exported ? "REGISTERED_SOURCE_ONLY" : "STAGED_READY") +
    "; 6 target tables + Faculty profile document columns; runtime PostgreSQL replay is still required.\n",
);
