import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.db.config";

/**
 * PostgreSQL integration for the REGISTERED Drizzle migration replay.
 *
 * These eight suites require SQL proposals that are deliberately not in the
 * numbered journal. They MUST execute in their own disposable PostgreSQL
 * jobs on CI; excluding them here is fixture partitioning, not a waiver.
 *
 * Original full matrix stays available through: npm run test:db
 */
export default mergeConfig(base, defineConfig({
  test: {
    exclude: [
      // DB08 staging / participation and external placement
      "tests/integration/placements-db08-batches.test.ts",
      "tests/integration/placements-db08-registration.test.ts",
      "tests/integration/placements-db08-external-offers.test.ts",
      "tests/integration/placements-w04-company-drive-facts.test.ts",
      // DB10 staged skill, triage, encrypted outbox and scoped FK
      "tests/integration/db10-skills-catalog.test.ts",
      "tests/integration/db10-log-alert-admin.test.ts",
      "tests/integration/db10-outbound-queue.test.ts",
      "tests/integration/db10-outbound-scope-fk.test.ts",
    ],
  },
}));
