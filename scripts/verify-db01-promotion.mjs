import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(relative) {
  const file = path.join(ROOT, relative);
  if (!existsSync(file)) {
    throw new Error(
      "Missing required DB01 source: " + relative,
    );
  }
  return readFileSync(file, "utf8");
}

const users = read("src/db/schema/users.ts");
const policy = read("src/modules/permissions/policy.ts");
const actor = read("src/modules/permissions/persisted-actor.ts");
const personName = read("src/modules/people/person-name.ts");
const adapter = read("src/modules/people/identity-profile.staged.ts");
const candidate = read("docs/planning/sql/db01-person-name-staging.sql");
const journal = JSON.parse(read("drizzle/meta/_journal.json"));
const errors = [];

for (const token of [
  "given_name varchar(120)",
  "family_name varchar(120)",
  "identity_profile_version integer",
  "users_identity_profile_version_ck",
]) {
  if (!candidate.includes(token)) {
    errors.push(
      "DB01 staged SQL invariant missing: " + token,
    );
  }
}

for (const token of [
  "personNameSchema",
  "displayNameFromPersonName",
]) {
  if (!personName.includes(token)) {
    errors.push(
      "DB01 person-name invariant missing: " + token,
    );
  }
}

for (const token of [
  '"identity.self.manage"',
  '"profile.self.manage"',
]) {
  if (!policy.includes(token)) {
    errors.push(
      "DB01 permission invariant missing: " + token,
    );
  }
}

for (const token of [
  'actorLock?: "share" | "update"',
  'options.actorLock === "update"',
]) {
  if (!actor.includes(token)) {
    errors.push(
      "Persisted actor lock invariant missing: " +
        token,
    );
  }
}

for (const token of [
  "assertPersistedPlatformPermission",
  '"identity.self.manage"',
  '"IDENTITY_PROFILE_VERSION_CONFLICT"',
  "identity_profile_version",
  '{ actorLock: "update" }',
]) {
  if (!adapter.includes(token)) {
    errors.push(
      "DB01 staged adapter invariant missing: " +
        token,
    );
  }
}

const activeColumns =
  users.includes('givenName: varchar("given_name"') &&
  users.includes(
    'familyName: varchar("family_name"',
  ) &&
  users.includes(
    'identityProfileVersion: integer("identity_profile_version")',
  );

const entries = Array.isArray(journal.entries)
  ? journal.entries
  : [];
const registered = entries.filter((entry) => {
  if (typeof entry?.tag !== "string") return false;
  const tag = entry.tag.toLowerCase();
  return (
    tag.includes("person_name") ||
    tag.includes("identity_profile")
  );
});

const drizzleDir = path.join(ROOT, "drizzle");
const activeSql = readdirSync(drizzleDir)
  .filter((name) => name.endsWith(".sql"))
  .map((name) => ({
    name,
    sql: readFileSync(
      path.join(drizzleDir, name),
      "utf8",
    ),
  }))
  .filter((entry) =>
    entry.sql.includes("identity_profile_version"),
  );

if (!activeColumns) {
  if (registered.length) {
    errors.push(
      "DB01 person-name migration is registered while users.ts remains staged",
    );
  }
  if (activeSql.length) {
    errors.push(
      "DB01 person-name columns exist in active migration while users.ts remains staged: " +
        activeSql.map((entry) => entry.name).join(", "),
    );
  }
} else {
  if (registered.length !== 1) {
    errors.push(
      "Expected exactly one registered DB01 person-name migration after schema activation",
    );
  } else {
    const entry = registered[0];
    const prefix = String(entry.idx).padStart(
      4,
      "0",
    );
    const sqlFile = path.join(
      ROOT,
      "drizzle",
      entry.tag + ".sql",
    );
    const snapshotFile = path.join(
      ROOT,
      "drizzle/meta",
      prefix + "_snapshot.json",
    );
    if (!existsSync(sqlFile)) {
      errors.push(
        "Registered DB01 SQL file is missing",
      );
    }
    if (!existsSync(snapshotFile)) {
      errors.push(
        "Registered DB01 snapshot is missing",
      );
    }
    if (existsSync(sqlFile)) {
      const sql = readFileSync(sqlFile, "utf8");
      for (const token of [
        "given_name",
        "family_name",
        "identity_profile_version",
      ]) {
        if (!sql.includes(token)) {
          errors.push(
            "Registered DB01 SQL missing: " +
              token,
          );
        }
      }
    }
  }
}

if (errors.length) {
  throw new Error(
    "DB01 promotion preflight failed:\n - " +
      errors.join("\n - "),
  );
}

process.stdout.write(
  "DB01 person-name promotion preflight: " +
    (activeColumns
      ? "REGISTERED_SOURCE_ONLY"
      : "STAGED_READY") +
    "; runtime PostgreSQL replay and Identity Directory sync tests are still required.\n",
);
