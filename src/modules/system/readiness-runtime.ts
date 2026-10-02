import "server-only";

import { checkDatabaseConnection } from "@/db/client";
import { getReadinessResult } from "./readiness";
import { logError } from "@/observability/logger";

export function getReadinessResultWithRuntime() {
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
