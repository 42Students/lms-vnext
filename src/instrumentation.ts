/**
 * Runs once when the server starts. Reports weak, placeholder, reused or malformed secrets (layer L11) as
 * structured warnings. It never throws and never logs a value, so a configuration problem is visible in the logs
 * without becoming a crash loop.
 */
export async function register() {
  if (process.env["NEXT_RUNTIME"] !== "nodejs") return;
  try {
    const { validateSecretConfig } = await import("@/security/secret-registry");
    for (const issue of validateSecretConfig()) {
      console.warn(JSON.stringify({ severity: "WARNING", event: "config.secret_invalid", name: issue.name, code: issue.code }));
    }
  } catch {
    /* configuration reporting must never stop the server */
  }
}
