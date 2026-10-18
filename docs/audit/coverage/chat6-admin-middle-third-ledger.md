# Chat-6 Super Admin middle-third coverage ledger

Source: `docs/orchestrator/ui-ux/pages-admin.md`, pages 38–74 of that file's `/admin` route inventory, scanned on 2026-10-18. This ledger records the **exact 37 page entrypoints retrieved for the review**, not completed behavioural acceptance. Only the specifically linked tests below are committed and cloud validation remains pending.

## Route inventory

| # | Route | Area | Adversarial check still required | Status |
|---|---|---|---|---|
| 38 | `/admin/inbound-mail` | Platform/academics | Private correspondence, no outward delivery | Source read; browser/DB pending |
| 39 | `/admin/lecture-halls` | Lecture halls | Selected tenant and invalid-id handling | Source read; browser/DB pending |
| 40 | `/admin/lecture-halls/[hallId]` | Lecture halls | Selected tenant and invalid-id handling | Source read; browser/DB pending |
| 41 | `/admin/lessons` | Platform/academics | Selected tenant and invalid-id handling | Source read; browser/DB pending |
| 42 | `/admin/live-classes` | Platform/academics | Selected tenant and invalid-id handling | Source read; browser/DB pending |
| 43 | `/admin/module-access` | Platform/academics | Platform permissions and module activation | Source read; browser/DB pending |
| 44 | `/admin/organizations` | Platform/academics | Cross-tenant org visibility and write grants | Source read; browser/DB pending |
| 45 | `/admin/people` | People | Role scope, private identity, export and audit | Source read; browser/DB pending |
| 46 | `/admin/people/directory` | People | Role scope, private identity, export and audit | Source read; browser/DB pending |
| 47 | `/admin/people/directory/[membershipId]` | People | Role scope, private identity, export and audit | Source read; browser/DB pending |
| 48 | `/admin/people/directory/[membershipId]/audit` | People | Role scope, private identity, export and audit | Source read; browser/DB pending |
| 49 | `/admin/people/unassigned` | People | Role scope, private identity, export and audit | Source read; browser/DB pending |
| 50 | `/admin/placements` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 51 | `/admin/placements/analytics` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 52 | `/admin/placements/applications` | Placements | Scoped roster, stage counts, export and mutations | Source read; browser/DB pending |
| 53 | `/admin/placements/applications/[applicationId]` | Placements | Scoped roster, stage counts, export and mutations | Source read; browser/DB pending |
| 54 | `/admin/placements/calendar` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 55 | `/admin/placements/drives` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 56 | `/admin/placements/hiring` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 57 | `/admin/placements/interviews` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 58 | `/admin/placements/interviews/[roundId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 59 | `/admin/placements/job-settings` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 60 | `/admin/placements/job-settings/[jobId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 61 | `/admin/placements/jobs/[jobId]` | Placements | Tenant job ID, lifecycle controls and CSV scope | Source read; browser/DB pending |
| 62 | `/admin/placements/jobs/[jobId]/applications` | Placements | Scoped roster, stage counts, export and mutations | Source read; browser/DB pending |
| 63 | `/admin/placements/jobs/[jobId]/schedule` | Placements | Tenant job ID, lifecycle controls and CSV scope | Source read; browser/DB pending |
| 64 | `/admin/placements/jobs/[jobId]/settings` | Placements | Tenant job ID, lifecycle controls and CSV scope | Source read; browser/DB pending |
| 65 | `/admin/placements/joining` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 66 | `/admin/placements/joining/[offerId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 67 | `/admin/placements/new` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 68 | `/admin/placements/offers` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 69 | `/admin/placements/offers/[offerId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 70 | `/admin/placements/retention` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 71 | `/admin/placements/screenings` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 72 | `/admin/placements/screenings/[applicationId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 73 | `/admin/placements/seasons` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |
| 74 | `/admin/placements/seasons/[seasonId]` | Placements | Scope selection, filtered candidate and company joins | Source read; browser/DB pending |

## Findings implemented and test links

- **SA-admin-middle-applications-export-01:** Shared College/Super Admin filtered CSV had narrower filters than visible roster. Strict export query now includes stage/source/department/program/batch. Tested by `tests/unit/chat6-superadmin-middle-third-adversarial.test.ts` (schema roundtrip and service scoping checks).
- **SA-admin-middle-placements-settings-01:** The drive deadline display was a UTC day fragment. Render full date/time in `Asia/Kolkata`, with regression checking an instant that rolls into the next IST day.
- **SA-admin-middle-read-03/04:** Shared `AdminScopedReadPage` calls `readAdminQuery`, shows invalid-filter recovery, requires selected college before calling the loader, and paginates within bounded rows; regression checks malformed filters and query encoding.
- **REC-home-drives-R05:** Existing Drawer uses native `<dialog>`, `showModal`, Escape/back dismiss and focus restoration; updated test aligns with the accessible `data-slot` attribute rather than expecting an obsolete tag opening.

## Release-gate work outstanding

1. Real authenticated browser test for **every row above**, including keyboard/touch mobile interactions, navigation, deep links, empty/error/loading states and after-revoke stale tabs.
2. PostgreSQL integration tests to assert wrong-college foreign identifiers cannot retrieve or mutate any user, application, job, interview, offer or message in any view or CSV.
3. Concurrency cases for destructive bulk actions, finalization and session/role changes.
4. CI typecheck, unit suite, E2E and object-store tests. Current GitHub connector cannot execute those tests.
5. Follow up with the owning shell/UX lanes where a page delegates to shared components. An imported guard name alone is not proof of correct tenant isolation.

**Verdict:** Entry-point source audit done; **full second-third interactive/security sign-off BLOCKED on running the app/CI**. No unverified page is marked complete.

## Session-revoke action hardening — chat-6 (AUTH-sessions-07)

Admin-college administrator session revocation uses a synchronous single-flight guard and `apiFetch` to prevent double submissions and to translate network/HTML failures into friendly copy. Failed submissions remain inside the confirmation dialog with a visible retry message; only successful revocation closes it and refreshes the listing. Covered by `tests/unit/chat6-auth-revoke-admin-flight-and-errors.test.ts`. Cloud CI, authenticated browser, and database races still require execution.

## SA-admin-middle-application-context-02 request-scope consistency

`/admin/placements/applications/[applicationId]` previously called `getCurrentRequestContext()` separately for detail and stage history. The page now acquires one authenticated selected-college context and passes the **identical** scope to both services. `tests/unit/chat6-super-admin-application-history-auth.test.ts` invokes the actual server page and asserts one context lookup, identical scoped arguments, no history access when the application is not visible, and no detail read after revoked-session failure. The history service independently repeats selected-college authorization and the detail service verifies college/organization joins. These are mocked role-journey tests, not a PostgreSQL concurrent-revocation certificate. Authored, not run.
