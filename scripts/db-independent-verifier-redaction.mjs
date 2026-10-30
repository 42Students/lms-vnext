/**
 * Never put connection secrets from verifier subprocess output into terminal
 * logs, stored acceptance receipts, or failure stack traces.
 * Raw output remains hashed separately for audit integrity; the hash itself
 * cannot be used to reconstruct a connection secret.
 */
export function redactVerifierOutput(value, env = process.env) {
  let output = String(value ?? "");
  const sensitive = [env.TEST_DATABASE_URL, env.DATABASE_URL, env.DB_PASSWORD, env.PGPASSWORD, env.POSTGRES_PASSWORD]
    .filter((candidate) => typeof candidate === "string" && candidate.length > 0);
  for (const secret of new Set(sensitive)) {
    output = output.split(secret).join("[REDACTED]");
  }
  // Catch Postgres URLs printed by child commands even when different from
  // the configured URL. Redact URL userinfo, preserving only the scheme/host.
  output = output.replace(
    /\b(postgres(?:ql)?:\/\/)[^\s/@]+@/gi,
    "$1[REDACTED]@",
  );
  // Docker failures may echo the generated, short-lived container password
  // from an argument, not from the caller's environment.
  output = output.replace(/(POSTGRES_PASSWORD=)[^\s"'\x60]+/g, "$1[REDACTED]");
  // A normalized URL in child output may differ from configured env URLs.
  // Query strings and fragments may carry passwords or private key material.
  output = output.replace(
    /\b(postgres(?:ql)?:\/\/[^\s?#]+)\?[^\s#]*/gi,
    "$1?[REDACTED]",
  );
  output = output.replace(
    /\b(postgres(?:ql)?:\/\/[^\s#]+)#[^\s]*/gi,
    "$1#[REDACTED]",
  );

  // libpq keyword DSNs, psql/driver diagnostics and environment echoes can
  // expose passwords without printing a postgres:// URL. Keep host/db context,
  // but never persist a credential value in logs or acceptance receipts.
  // Handle single/double quoted values (including escaped quotes) as one unit.
  output = output.replace(
    /\b((?:PGPASSWORD|POSTGRES_PASSWORD|DB_PASSWORD|sslpassword|password)\s*(?:=|:)\s*)(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s;,"'\x60]+)/gi,
    "$1[REDACTED]",
  );

  return output;
}
