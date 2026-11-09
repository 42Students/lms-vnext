# UX-G098 — Tpo · Home → Batches (part 1)

## Scope

16 registered page/error/loading surfaces (plus 0 additional route-only entries). This is an engineering UX pass, not a release or security certification.

- `/tpo/announcements/page.tsx`
- `/tpo/audit/actors/page.tsx`
- `/tpo/audit/page.tsx`
- `/tpo/batches/page.tsx`
- `/tpo/page.tsx`

## Implemented on main

- Route-specific failure recovery now keeps the existing retry/action and an explicit safe path to the TPO home, batch list, calendar, company list or placement list, as relevant.
- A failed read is not treated as an empty dataset or successful placement mutation. Sensitive error details are not exposed.
- Loading copy and in-shell error presentation refined where affected. Existing TPO role, tenant, data-service and mutation logic remains in place.
- Source changes: [c641e73867555dd6239095f4120571003c93894c](https://github.com/42Students/lms-vnext/commit/c641e73867555dd6239095f4120571003c93894c).

## Remaining acceptance

The new shared recovery fixture is strictly development-flag gated and uses synthetic errors, never real tenant data. It exercises the actual error components at 1280×800 and 390×844, keyboard retry/safe-exit and no overflow; real seeded Learner-denial checks separately verify TPO access boundaries. Those checks are valuable but **do not independently prove all 16 operational surfaces**. Verify relevant live role workflows, existing regression suites and exact-SHA CI before changing this group to DONE.

- Unit: `npx vitest run tests/unit/ux-tpo-ten-recovery.test.ts`
- Browser: `npx playwright test tests/e2e/ux-tpo-ten-recovery.spec.ts --project=chromium --workers=2`
- Workflow: `.github/workflows/ux-tpo-ten-recovery-acceptance.yml`
- Evidence target: [TPO recovery CI runs](https://github.com/42Students/lms-vnext/actions/workflows/ux-tpo-ten-recovery-acceptance.yml)

Status as authored: **DOING — executed acceptance not yet verified**.

## Executed partial acceptance and current boundary (2026-11-09)

- At commit [1a4ecb4](https://github.com/42Students/lms-vnext/commit/1a4ecb443dd004b34db92d536495b20ee22e7a55), [workflow 42580993668](https://github.com/42Students/lms-vnext/actions/runs/42580993668) passed exact-SHA lint, TypeScript, focused Vitest, disposable PostgreSQL role seeding and **32/32 desktop/mobile Chromium tests (0 skipped, 0 flaky)**. The tests include authenticated production-route repeated-query recoveries and Learner denial in addition to synthetic fallback component checks.
- The deeper batch-history, scheduling, interview, Companies Today, announcement and drive-day recovery improvements at [b5e519e](https://github.com/42Students/lms-vnext/commit/b5e519e3c925cabb48b6349ef31d3bf8636e3e31), [0c08422](https://github.com/42Students/lms-vnext/commit/0c084224a983e005ec8db05da631a038a9f57461) and [381aec9](https://github.com/42Students/lms-vnext/commit/381aec9273054f9340e7fc2d08c150001e529a77) were independently verified at [workflow 42595568572](https://github.com/42Students/lms-vnext/actions/runs/42595568572), exact SHA `381aec9273054f9340e7fc2d08c150001e529a77`: **16/16 focused Vitest**, lint, TypeScript, isolated PostgreSQL seed and **44/44 desktop/mobile Chromium** with zero skipped, failed or flaky scenarios. Includes protected production URLs and the development-only synthetic error preview. Screenshots/traces are retained in the workflow artifacts.
- All **16 registered source files** for this group were inspected for basic error/reset/alternative navigation, loading affordances and raw exception disclosure. This is a source review, not proof of all operational page jobs. Announcements, audit, batch directory and root TPO recovery were inspected. Actual TPO Home, Batches and announcement duplicate-filter paths are exercised; compose/send, audit exports and bulk cohort actions still require persisted end-to-end checks.
- Normal authenticated TPO page-shell acceptance was also executed at [workflow 42596318660](https://github.com/42Students/lms-vnext/actions/runs/42596318660), exact SHA [`32e29a8`](https://github.com/42Students/lms-vnext/commit/32e29a84448566f6b76e05e37b5153a71c485369): **60/60 Chromium, 16/16 Vitest, scoped lint and TypeScript passed, zero skipped/flaky/failed**. The additional 16 Chromium scenarios verify eight production TPO page shells at desktop/mobile with seeded identity, page heading, navigation containment and horizontal-overflow assertions. This broadens live-route and empty/error verification but still does not exercise the group-wide business CRUD/export/undo/tenant-negative matrix.
- **Canonical status remains DOING.** Full group completion needs role-authenticated browser verification of all relevant page actions, actual persisted outcomes and permission/cross-college negatives. A successful recovery fixture or static source scan alone does not earn DONE.

## Persisted audit and authenticated page verification (2026-11-09)

- Exact SHA [7ab0357](https://github.com/42Students/lms-vnext/commit/7ab0357d82b2ad55956b7a0c9078ba1b0b3a6475), [workflow 42609610562](https://github.com/42Students/lms-vnext/actions/runs/42609610562) PASS: 84/84 Chromium desktop/mobile (0 skipped/flaky/failed), 18/18 unit, 2/2 real PostgreSQL integration, full TypeScript/lint and disposable PG17 two-college seed.
- The database fixture writes real canonical activity_events for both TPO actors. The actor audit service and CSV only return owning-college rows; the cross-college selector and Learner role are denied or scoped empty. Browser acceptance checks the persisted actor audit event and its scoped export-filter link.
- /tpo/audit and /tpo/audit/actors reject duplicate and foreign query selectors; /tpo/announcements rejects malformed pagination and team selectors rather than silently switching the view. The audit CSV download still requires actual recent device authentication: test-only impersonation is denied, not reported as a successful download.
- Outstanding: persisted announcement author/send/edit/delete/undo with verified recipient delivery worker; successful recent-device CSV export; actual cohort bulk/undo operations, modal states and complete cross-college journeys. Partial evidence only; DOING, not DONE.
