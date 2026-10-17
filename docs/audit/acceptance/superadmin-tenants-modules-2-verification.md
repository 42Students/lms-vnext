# Super Admin Tenant Settings, additional gap verification (chat-13)

Source evidence only; unit, database and browser execution remain with the orchestrator. Free-form values are deliberately stored as inactive metadata, not an unreviewed runtime execution path.

| ID | Status | Evidence |
|---|---|---|
| SA-tenants-modules-40 | DONE | src/modules/platform-settings/admin-editor-service.ts; src/app/api/admin/settings/overrides/route.ts; src/components/admin/tenant-settings-other-keys.tsx; tests/unit/chat13-tenant-settings-other-keys-gap40.test.ts — tests named SA-tenants-modules-40 (written, not run) |

## Runtime checks outstanding
- Verify add/remove and stale-version conflict against PostgreSQL on migration 0119.
- Verify global vs college role and scope, mobile and accessibility in browser.

| SA-tenants-modules-32 | DONE | src/modules/module-access/admin-college-rule-history-service.ts; src/modules/module-access/admin-college-rule-history-model.ts; src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx; tests/unit/chat13-module-access-history-gap32.test.ts — SA-tenants-modules-32 all-scope paginated activity (source tests authored, not run) |

| SA-tenants-modules-30 | NOT-A-GAP | src/components/admin/descendant-feature-rule-editor.tsx; src/modules/module-access/admin-descendant-rule-model.ts; src/db/schema/module-access.ts; tests/unit/chat13-module-access-lock-gap30.test.ts — descendant lock toggle exists and schema requires an explicit enabled value, so value-less legacy lock rows cannot be created (source test not run) |

## Chat-6 UNCONFIRMED decisions, 2026-10-18

| SA-tenants-modules-30 | NOT-A-GAP | module_access_rules.enabled is NOT NULL; no orphan-lock clear permitted; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-30` |
| SA-tenants-modules-31 | NOT-A-GAP (layout only) | Deep-linkable Super Admin trace replaces unscoped drawer; placement provenance still to test; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-31` |
| SA-tenants-modules-38 | OPEN | Enforce runtime policy bounds before offering tenant-editable knobs; decision evidence: `docs/audit/acceptance/chat-6-unconfirmed-decisions.md`; test: `tests/unit/chat6-unconfirmed-decisions-round13.test.ts` → `SA-tenants-modules-38` |

## chat-13 2026-10-18 independent Module Access and Tenant Settings cross-check
| Gap | Decision | Evidence |
|---|---|---|
| SA-tenants-modules-31 | DONE (source) | Scoped learner trace shows actual placement-cell decision and provenance. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-31` (written, not run). |
| SA-tenants-modules-32 | DONE (source) | Unified access history shows descendant/student/college and bulk audit events. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-32` (written, not run). |
| SA-tenants-modules-36 | PARTIAL (source) | Typed SMS fields persist; live provider/DLT consumption not verified. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-36` (written, not run). |
| SA-tenants-modules-37 | PARTIAL (source) | Typed course/polling fields persist; runtime progress and chat consumers still use source constants. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-37` (written, not run). |
| SA-tenants-modules-38 | PARTIAL (source) | Typed interview/application fields persist; active policy consumer enforcement remains unverified. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-38` (written, not run). |
| SA-tenants-modules-39 | PARTIAL (source) | Typed operational caps persist; enforcement consumers are not wired. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-39` (written, not run). |
| SA-tenants-modules-40 | DONE (source) | Other stored keys can be added/removed with audit/version checks. `tests/unit/chat13-superadmin-gap-register-reconcile-c.test.ts` test `SA-tenants-modules-40` (written, not run). |


## chat-13 additional runtime consumer verification — 2026-10-18
| Gap | Decision | Evidence and remaining work |
|---|---|---|
| SA-tenants-modules-37 | PARTIAL — runtime behavior improved | `src/modules/courses/learner-playback-settings.ts` reads strictly global 0119 overrides and validates 5,000–600,000 ms plus watched/in-progress thresholds; `src/modules/courses/progress-service.ts` applies persisted in-progress and completion thresholds to learner read/write; `src/components/courses/learner-course-workspace.tsx` passes the configured save interval to both YouTube and hosted video. `tests/unit/chat13-tenant-settings-runtime-gap37.test.ts` (4 ID-named tests). Classroom chat polling currently has no verified consuming reader, so this gap is not fully closed. |
| SA-tenants-modules-38 | PARTIAL — validated but not activated | `src/modules/platform-settings/runtime-numeric-model.ts` and `runtime-numeric-service.ts` provide bounded, GLOBAL-only typed numeric values. `tests/unit/chat13-runtime-setting-limits-gap38-gap39.test.ts` verifies placement policy bounds. Existing booking and rate-limit consumers have NOT been wired to these overrides; do not claim behavior changes. |
| SA-tenants-modules-39 | PARTIAL — announcement cap active in source | `src/modules/announcements/service.ts` queries `ops.announcementMaxPageSize` before scoped page reads, reduces actual query size and keeps an independent 100-row hard ceiling. `tests/unit/chat13-runtime-setting-limits-gap38-gap39.test.ts` (3 ID-named tests). Bulk status, progress bulk and identity JSON caps still need independent runtime integration; do not advertise their overrides as active. |

All tests above are authored, not run; live Postgres, browser and concurrency verification is outstanding. Configured values exceeding the backend safety maximum cannot increase the hard cap.
