# Superseded DB08 branch: complete source archive

**Historical branch:** `db08-placement-policy-outcomes-2026` at commit `4541410bcc2eeb7e5c0e72c345833b017ce0096e`.

**Safety:** This directory copies all 26 DB08 changed files from the historical isolated branch verbatim by their **original Git blob SHA**. Archived `.ts` source/test files have a final `.txt` extension so TypeScript and Vitest do not compile duplicate conflicting DB08 models. SQL is **review-only** and must not be executed. JSON state maps to the superseded schema, not the live canonical DB08 ledger.

**Canonical implementation:** the pre-existing `src/db/schema/placement-batches.ts`, `placement-registration.ts`, `placement-debarments.ts`, `placement-external.ts` on `main`; and `docs/planning/database-parity-db08-branch-reconciliation.md`. The old branch's duplicate types/tables cannot safely be wired to main because they violate the latest V188 per-cohort registration model and collide with existing table names.

All implementation ideas and test cases are retained here. *Archived source is not active deployed functionality.* Main already received the separate DB08 eligibility precedence fix and an adapted saved-jobs service; other behaviors remain explicit test/migration blockers, not silent losses.

## Full source-manifest (old path → archived file, same blob)

- `docs/planning/database-parity-db08-lifecycle-staged-migration.sql` → `docs/archive/db08-placement-policy-outcomes-2026/docs/planning/database-parity-db08-lifecycle-staged-migration.sql` (blob `4075869045d91a6cd9f8739ef65be85d128ba517`)
- `docs/planning/database-parity-db08-parallel-audit.md` → `docs/archive/db08-placement-policy-outcomes-2026/docs/planning/database-parity-db08-parallel-audit.md` (blob `52d438e5ff9ee66c1e0713d02384a43558e6be38`)
- `docs/planning/database-parity-db08-parallel-tracker.json` → `docs/archive/db08-placement-policy-outcomes-2026/docs/planning/database-parity-db08-parallel-tracker.json` (blob `fa000d2ea3eb90de08c640463ca501b7168d87fa`)
- `docs/planning/database-parity-db08-staged-migration.sql` → `docs/archive/db08-placement-policy-outcomes-2026/docs/planning/database-parity-db08-staged-migration.sql` (blob `c84dbc4224d2816f9d43fb602fedbf6aa4fc4d63`)
- `src/db/schema/index.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/db/schema/index.ts.txt` (blob `a85336654f6b0876f6dc62ce43b716ca7a7fd40c`)
- `src/db/schema/placement-access.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/db/schema/placement-access.ts.txt` (blob `808ed8606e4607ffd74941c01113b2a1b2167545`)
- `src/db/schema/placement-db08-lifecycle.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/db/schema/placement-db08-lifecycle.ts.txt` (blob `ea8f05d076d9f4b041d6166fa5c0588f4b7c8b4d`)
- `src/db/schema/placement-eligibility-actions.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/db/schema/placement-eligibility-actions.ts.txt` (blob `80e85c5943c9d8b2193ca26528b415993b46bfa7`)
- `src/db/schema/placement-saved-jobs.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/db/schema/placement-saved-jobs.ts.txt` (blob `dbc96c5de3d278f4369202e5a9a570826f3c859d`)
- `src/lib/api-error.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/lib/api-error.ts.txt` (blob `afc1c5d0e45c43d12bb187db5b33cb2e7a7aaa67`)
- `src/modules/placements/access-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/access-service.ts.txt` (blob `bcff0de2cace14d35eb49e2cdb2dc63e26b979ca`)
- `src/modules/placements/db08-batch-registration-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/db08-batch-registration-service.ts.txt` (blob `c6b57f2e3ae140043e732aba8a69dc7b6d653a57`)
- `src/modules/placements/db08-debarment-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/db08-debarment-service.ts.txt` (blob `e41cc7f320bc23c42da00b7366a4a18a42d0a1dc`)
- `src/modules/placements/db08-external-outcome-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/db08-external-outcome-service.ts.txt` (blob `127c6ebd66687de81b9fd57bb39003e5fab4d144`)
- `src/modules/placements/db08-lifecycle-validation.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/db08-lifecycle-validation.ts.txt` (blob `288ab806ade259c6d74d947a2d36917ac016573c`)
- `src/modules/placements/db08-saved-job-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/db08-saved-job-service.ts.txt` (blob `195dcc27df478be249689964ef59bf6a454f4d07`)
- `src/modules/placements/eligibility-action-service.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/eligibility-action-service.ts.txt` (blob `b0e78a02674d7b620bbce9f110b678e6dc0b1def`)
- `src/modules/placements/eligibility-action-validation.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/eligibility-action-validation.ts.txt` (blob `5606bcc22590390f564aa255079f5eacb4e314c5`)
- `src/modules/placements/errors.ts` → `docs/archive/db08-placement-policy-outcomes-2026/src/modules/placements/errors.ts.txt` (blob `6304ea3d93bfd9078d7bd35cd1afdba82ed80f0e`)
- `tests/integration/placements-db08-actions.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/integration/placements-db08-actions.test.ts.txt` (blob `611abbf63404c9f77bfb681e0715165b4bfc14be`)
- `tests/integration/placements-db08-lifecycle.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/integration/placements-db08-lifecycle.test.ts.txt` (blob `778b50ba2d6d8ab48b7325369860e571e7c01633`)
- `tests/unit/placement-access.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/unit/placement-access.test.ts.txt` (blob `991459d38e192aed6800af5c63b8f05e8c364592`)
- `tests/unit/placement-db08-ledger.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/unit/placement-db08-ledger.test.ts.txt` (blob `a0d24936c32397e81a4b7b238ce510a850ae0284`)
- `tests/unit/placement-db08-lifecycle.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/unit/placement-db08-lifecycle.test.ts.txt` (blob `4ec9880593fab08bbb41a260b4479b6944e4cf8b`)
- `tests/unit/placement-db08-schema.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/unit/placement-db08-schema.test.ts.txt` (blob `06f16cfe8af0bdf0069054aca1b7e3afabe274fa`)
- `tests/unit/placement-eligibility-actions.test.ts` → `docs/archive/db08-placement-policy-outcomes-2026/tests/unit/placement-eligibility-actions.test.ts.txt` (blob `bd9468774024acc200e02191a069666733b73c13`)
