/**
 * DB-058: fail-closed target selection for DB18 integration witnesses.
 *
 * Reuses the canonical DB01 disposable database guard. The independent
 * verifier legitimately supplies DATABASE_URL === TEST_DATABASE_URL for
 * service-backed tests after provisioning a disposable PostgreSQL fixture.
 * That precise alias is allowed only for the verifier isolation flag.
 */
import { assertSafeDb01TestTarget } from "../../scripts/db01-test-database-guard.mjs";

export function assertDb018DisposableTarget(env = process.env, options = {}) {
  const testUrl = env.TEST_DATABASE_URL;
  const dedicated = env.DB018_ISOLATED_TEST_DATABASE === "1";
  const independentVerifier = env.DB03_ISOLATED_TEST_DATABASE === "1";
  if (!testUrl || (!dedicated && !independentVerifier)) {
    throw new Error("DB018 refused: explicit TEST_DATABASE_URL and DB018/DB03 isolation flag required");
  }
  if (options.serviceBound && env.DATABASE_URL !== testUrl) {
    throw new Error("DB018 refused: service-backed DATABASE_URL must equal TEST_DATABASE_URL");
  }
  const appAliasIsIdentical = Boolean(env.DATABASE_URL && env.DATABASE_URL === testUrl);
  if (appAliasIsIdentical && !independentVerifier) {
    throw new Error("DB018 refused: application database alias requires independent verifier isolation");
  }
  // DB01 forbids resetting the configured app DB. Only the trusted verifier
  // deliberately aliases its disposable DB for subsequent non-reset tests.
  const validationEnv = appAliasIsIdentical
    ? { ...env, DATABASE_URL: undefined }
    : env;
  const safe = assertSafeDb01TestTarget(validationEnv);
  return Object.freeze({ host: safe.host, database: safe.database, mode: safe.mode });
}
