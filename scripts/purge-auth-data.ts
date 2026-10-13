import { Pool } from "pg";
import { purgeAuthData } from "../src/modules/auth/retention";
import { migrationPoolConfigFromEnv } from "./db-lib";
import {
  logError,
  writeStructuredLog,
} from "../src/observability/logger";

async function main() {
  const pool = new Pool(migrationPoolConfigFromEnv());
  try {
    const result = await purgeAuthData(pool);
    writeStructuredLog("INFO", "auth.retention_purged", {
      component: "retention",
      ...result,
    });
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  logError("auth.retention_failed", error, { component: "retention" });
  process.exitCode = 1;
});
