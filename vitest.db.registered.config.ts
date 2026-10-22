import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.db.config";

/**
 * PostgreSQL integration for the REGISTERED Drizzle migration replay.
 *
 * These ten suites require SQL proposals that are deliberately not in the
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
      // Both throw at import unless DB08_ISOLATED_TEST_DATABASE=1, and the
      // phase 2 suite wipes placement tables globally: DB08 job only.
      "tests/integration/placements-phase2-learner-gates.test.ts",
      "tests/integration/tpo-batch-workspace-db08.test.ts",
      // DB10 staged skill, triage, encrypted outbox and scoped FK
      "tests/integration/db10-skills-catalog.test.ts",
      "tests/integration/db10-log-alert-admin.test.ts",
      "tests/integration/db10-outbound-queue.test.ts",
      "tests/integration/db10-outbound-scope-fk.test.ts",
    ],
  },
}));
