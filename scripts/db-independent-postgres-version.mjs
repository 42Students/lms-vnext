/** Only PostgreSQL 17 can produce a DB-001 engine-specific certificate. */
export function assertPostgres17Version(versionText) {
  // SHOW server_version returns e.g. 17.11 (Debian ...); the Docker
  // executable returns postgres (PostgreSQL) 17.11.
  const version = String(versionText ?? "").trim();
  const match = /^(?:postgres\s+\(PostgreSQL\)\s+)?(\d+)(?:\.\d+)?(?:\s|$)/.exec(version);
  if (!match || Number(match[1]) !== 17) {
    // Never echo untrusted server output: it may contain connection secrets.
    throw new Error("DB-001 requires PostgreSQL major version 17 before running database gates");
  }
  return 17;
}
