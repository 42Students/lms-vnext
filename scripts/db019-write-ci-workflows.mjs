#!/usr/bin/env node
/**
 * Writes .github/workflows/db019-pXX-source-acceptance.yml for each
 * unpicked package that has a field review but no CI workflow yet.
 * The workflow runs the source-quality test only (no PG17 needed).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PACKAGES = [
  { id: "DB19-P05", short: "p05", title: "Learner faculty recruiter identity source acceptance",
    modules: ["src/modules/auth/**", "src/modules/users/**", "src/modules/colleges/**"],
    integrationTests: ["tests/integration/learner-profile*.test.ts", "tests/integration/faculty*.test.ts"] },
  { id: "DB19-P06", short: "p06", title: "Academics teaching timetable source acceptance",
    modules: ["src/modules/academics/**", "src/modules/courses/**"],
    integrationTests: ["tests/integration/academics*.test.ts", "tests/integration/courses-c1*.test.ts"] },
  { id: "DB19-P08", short: "p08", title: "Profiles qualifications verification source acceptance",
    modules: ["src/modules/profiles/**", "src/modules/users/**"],
    integrationTests: ["tests/integration/profile*.test.ts"] },
  { id: "DB19-P09", short: "p09", title: "Courses lessons content activity source acceptance",
    modules: ["src/modules/courses/**", "src/modules/content/**"],
    integrationTests: ["tests/integration/courses-c2*.test.ts", "tests/integration/courses-c3*.test.ts"] },
  { id: "DB19-P10", short: "p10", title: "Historical exams retired assessment source acceptance",
    modules: ["src/modules/assessments/**"],
    integrationTests: [] },
  { id: "DB19-P13", short: "p13", title: "Project workspaces templates membership source acceptance",
    modules: ["src/modules/projects/**"],
    integrationTests: ["tests/integration/projects-p1*.test.ts"] },
  { id: "DB19-P14", short: "p14", title: "Project sprint tasks comments activity source acceptance",
    modules: ["src/modules/projects/**"],
    integrationTests: ["tests/integration/projects-p2*.test.ts"] },
  { id: "DB19-P15", short: "p15", title: "Project resources delivery release source acceptance",
    modules: ["src/modules/projects/**"],
    integrationTests: ["tests/integration/projects-p3*.test.ts"] },
  { id: "DB19-P23", short: "p23", title: "Recruiter CRM company notes source acceptance",
    modules: ["src/modules/placements/**"],
    integrationTests: ["tests/integration/placements-crm*.test.ts"] },
  { id: "DB19-P25", short: "p25", title: "Drive coordination rounds requests source acceptance",
    modules: ["src/modules/placements/**"],
    integrationTests: ["tests/integration/placements-p5*.test.ts"] },
  { id: "DB19-P27", short: "p27", title: "Announcements notification templates SMS source acceptance",
    modules: ["src/modules/notifications/**", "src/modules/messaging/**"],
    integrationTests: ["tests/integration/notifications*.test.ts"] },
];

for (const pkg of PACKAGES) {
  const workflowPath = path.join(root, `.github/workflows/db019-${pkg.short}-source-acceptance.yml`);
  if (fs.existsSync(workflowPath)) {
    console.log(`SKIP ${pkg.id}: workflow already exists`);
    continue;
  }

  const testFile = `tests/db019-${pkg.short}-field-review.test.mjs`;
  const reviewFile = `docs/planning/db019-${pkg.short}-field-review.json`;

  const integrationRunSteps = pkg.integrationTests
    .filter(t => {
      // Only include if a test file matching the pattern might exist
      return true;
    })
    .map(t => `      - name: Integration tests (if exist)
        continue-on-error: true
        run: |
          FILES=$(find tests/integration -name "$(echo '${t}' | sed 's|tests/integration/||')" 2>/dev/null || echo "")
          if [ -n "$FILES" ]; then
            npx vitest run --config vitest.db.registered.config.ts $FILES
          else
            echo "No integration test files matched ${t} — skipping"
          fi`)
    .join("\n");

  const yaml = `# Source-quality acceptance for ${pkg.id} — field census and identity pinning.
# This workflow proves the source gate only; runtime PG17 acceptance remains open.
name: ${pkg.title}

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - "${testFile}"
      - "${reviewFile}"
      - '.github/workflows/db019-${pkg.short}-source-acceptance.yml'

permissions:
  contents: read

concurrency:
  group: db019-${pkg.short}-\${{ github.sha }}
  cancel-in-progress: false

jobs:
  source-quality:
    name: "${pkg.id} source field census and identity pinning"
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Verify exact commit SHA
        run: test "$(git rev-parse HEAD)" = "\$GITHUB_SHA"
      - name: "${pkg.id} source field census (no database)"
        run: node --test ${testFile}
      - name: Scope boundary
        if: always()
        run: |
          echo "${pkg.id} source-quality gate only."
          echo "Runtime PG17 producer/consumer acceptance and DB019/DB020 remain OPEN."
`;

  fs.writeFileSync(workflowPath, yaml);
  console.log(`Written: .github/workflows/db019-${pkg.short}-source-acceptance.yml`);
}
