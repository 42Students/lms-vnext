import "server-only";

import { checkDatabaseConnection } from "@/db/client";
import { getReadinessResult } from "./readiness";

export function getReadinessResultWithRuntime() {
  return getReadinessResult(checkDatabaseConnection);
}
