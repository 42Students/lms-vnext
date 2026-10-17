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

| SA-tenants-modules-25 | DONE — FIXED-ON-MAIN; integration pending | `src/app/(authenticated)/admin/features/page.tsx` embeds `CollegeFeatureRuleEditor` inside per-college/module matrix, supports Inherit/On/Off and lock, fetches latest policy and impact before confirmation, writes only with a persisted-rule receipt. `tests/unit/chat16-final-sa-tenants-modules-25.test.ts` → `SA-tenants-modules-25 renders independent college x module editors with explicit inherited states` and guarded write assertion. |

| SA-tenants-modules-29 | DONE — FIXED-ON-MAIN; service runtime pending | `src/components/admin/college-feature-rule-editor.tsx` obtains impact/population before confirming, disables writes if counts unavailable, requires explicit acknowledgment for >=100 active learners, and warns for lock changes. `tests/unit/chat16-final-sa-tenants-modules-29.test.ts` → `SA-tenants-modules-29 fetches verified active population, otherwise fails closed` and lock/threshold test. A fabricated zero is never used as a safety proxy. |

| SA-tenants-modules-35 | DONE — FIXED-ON-MAIN; deployment validation pending | Global `LEGACY_TENANT_SETTING_SPECS` includes `baseDomain`, `globalHost`, cookie domain/SameSite, Super Admin IP allowlist and OTP limits. `src/components/admin/tenant-settings-editor.tsx` edits versioned overrides behind high-impact confirmation; `src/modules/platform-settings/admin-editor-service.ts` checks domains, enum and CIDRs. `tests/unit/chat16-final-sa-tenants-modules-35.test.ts` → `SA-tenants-modules-35 exposes host, cookie, privileged IP and OTP settings through validated global editor` and risk validation test. Runtime activation still requires approved deployment. |
