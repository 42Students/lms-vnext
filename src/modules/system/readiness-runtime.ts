import "server-only";

import { checkDatabaseConnection } from "@/db/client";
import { getReadinessResult } from "./readiness";
import { logError } from "@/observability/logger";
import { validateSecretConfig } from "@/security/secret-registry";

import { env } from "@/config/env";
/**
 * In production a missing or weak required secret makes this instance NOT READY (SEC-09). During a rolling update the
 * previous, healthy replicas keep serving, so a bad configuration never takes traffic and never crash-loops.
 * Elsewhere (dev, test) the problem is only reported in the startup log. Secret names are logged, never returned.
 */
export async function getReadinessResultWithRuntime() {
  const result = await getReadinessResultBase();
  if (env.APP_ENV !== "production" || result.httpStatus !== 200) return result;
  const issues = validateSecretConfig();
  if (issues.length === 0) return result;
  logError("readiness.configuration_invalid", new Error("required secrets missing or weak"), { component: "configuration", names: issues.map((issue) => issue.name) });
  return {
    httpStatus: 503 as const,
    payload: { ...result.payload, status: "not_ready" as const, dependencies: { ...result.payload.dependencies, configuration: "invalid" as const } },
  };
}

function getReadinessResultBase() {
  return getReadinessResult(async () => {
    try {
      await checkDatabaseConnection();
    } catch (error) {
      logError("readiness.database_unavailable", error, {
        component: "database",
      });
      throw error;
    }
  });
}
