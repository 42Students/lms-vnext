# Chat-9 Super Admin last-third source audit — 18 October 2026

Scope: 37 routes (positions 75–111) of `docs/orchestrator/ui-ux/pages-admin.md`. Every route has a named source contract in `tests/unit/ux-admin-chat9-batch-01..04.test.ts`, and `tests/unit/ux-admin-chat9-coverage-closure.test.ts` checks the mapping. These **source tests do not certify** interactive, responsive, a11y, authorization, state or database behavior. Do not present as a completed release audit.

## Route inventory

| Route | Source-contract test | Live behavior / role/phone audit |
| --- | --- | --- |
| `/admin/placements/shortlisted` | `UX-admin-placements-shortlisted-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/placements/shortlisted/[applicationId]` | `UX-admin-placements-shortlisted-application-id-01`, `SA-placements-shortlisted-01/07` | Service SQL pins shortlisted outcome, job, learner membership and college+organization; role disabled/invalid UUID/no data denials, privacy facts exclude recruiter notes. Page shows denied/no scope and safe service-error recovery. `tests/unit/PROJ-BREAK-chat9-sa-shortlisted-detail.test.ts`, `tests/unit/PROJ-BREAK-chat9-sa-shortlisted-page.test.tsx`. Live PG/browser role journey OPEN. |
| `/admin/placements/student-lookup` | `UX-admin-placements-student-lookup-01`, `SA-placements-student-lookup-01/07` | Page rejects duplicate/overlong search before PII query, requires a selected college, and service SQL joins both jobs and company relationships to the current college. `tests/unit/PROJ-BREAK-chat9-sa-student-lookup-recovery.test.tsx`, `tests/unit/PROJ-BREAK-chat9-sa-student-lookup-tenant.test.ts`. PG/browser authorization pending. |
| `/admin/programs` | `UX-admin-programs-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects` | `UX-admin-projects-01`, `PROJ-BREAK-admin-resilience-24/25`, `PROJ-BREAK-admin-idor-26`, `PROJ-BREAK-admin-input-27` | Direct server-component element-tree tests prove selected-college prerequisite, invalid and duplicate URL rejection before SQL, independent template failure, sanitized DB outage and preserved search/filter retry. `tests/unit/PROJ-BREAK-chat9-admin-project-list-page.test.tsx`. Real PostgreSQL, live browser and independent role journey remain **OPEN**. |
| `/admin/projects/[projectId]` | `UX-admin-projects-project-id-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/[projectId]/[section]` | `UX-admin-projects-project-id-section-01`, `PROJ-BREAK-ux-38/39`, `PROJ-BREAK-idor-55` | Unknown sections 404 before service calls; unauthorized tenant fails before workspace fetch; breadcrumbs whitelist referrals/reasons and encode query navigation. `tests/unit/PROJ-BREAK-chat9-admin-project-sections.test.tsx`. Live browser/role matrix still OPEN. |
| `/admin/projects/[projectId]/readiness` | `UX-admin-projects-project-id-readiness-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/at-risk` | `UX-admin-projects-at-risk-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/audit` | `UX-admin-projects-audit-01` + `PROJ-BREAK-ux-22..26` + `PROJ-BREAK-idor-24..26` | Invalid URL recovery, global Super Admin-only template activity, selected-scope isolation, actual remaining-page counter. **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/readiness` | `UX-admin-projects-readiness-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/reassign-mentor` | `UX-admin-projects-reassign-mentor-01`, `PROJ-BREAK-idor-59/60`, `PROJ-BREAK-ux-44` | Selected-college authorization gates the bulk mentor UI before its data component; missing college never falls back to organization-wide selection. `tests/unit/PROJ-BREAK-chat9-sa-mentor-reassignment-page.test.tsx`; DB mutation and browser confirmation OPEN. |
| `/admin/projects/submissions` | `UX-admin-projects-submissions-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates` | `UX-admin-projects-templates-01`, `PROJ-BREAK-ux-30/33` | Permission-denied and DB-outage recovery, malformed filters, exact scoped empty state in server element-tree tests (`tests/unit/PROJ-BREAK-chat9-template-directory-page.test.tsx`); live browser and full role matrix OPEN |
| `/admin/projects/templates/[templateId]` | `UX-admin-projects-templates-template-id-01`, `PROJ-BREAK-ux-40/43` | Authorized read gate precedes DB; denied, invalid UUID and outage safe recovery keep private version/college assignments hidden. `tests/unit/PROJ-BREAK-chat9-template-detail-pages.test.tsx`; browser/PG role verification OPEN. |
| `/admin/projects/templates/[templateId]/colleges` | `UX-admin-projects-templates-template-id-colleges-01`, `PROJ-BREAK-ux-34/37` | Denied role never reads, invalid URL recovers, service outage retains filters and does not claim availability, legitimate zero results show empty. `tests/unit/PROJ-BREAK-chat9-template-college-page.test.tsx`. Browser and DB role checks OPEN. |
| `/admin/projects/templates/[templateId]/overview` | `UX-admin-projects-templates-template-id-overview-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/resources` | `UX-admin-projects-templates-template-id-resources-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/sprints` | `UX-admin-projects-templates-template-id-sprints-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/tasks` | `UX-admin-projects-templates-template-id-tasks-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/versions` | `UX-admin-projects-templates-template-id-versions-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/versions/[versionId]` | `UX-admin-projects-templates-template-id-01`, `PROJ-BREAK-ux-40/43` | Authorized read gate precedes DB; denied, invalid UUID and outage safe recovery keep private version/college assignments hidden. `tests/unit/PROJ-BREAK-chat9-template-detail-pages.test.tsx`; browser/PG role verification OPEN. |
| `/admin/projects/templates/new` | `UX-admin-projects-templates-new-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/workspaces/new` | `UX-admin-projects-workspaces-new-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/quizzes` | `UX-admin-quizzes-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/recruiters` | `UX-admin-recruiters-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/resources` | `UX-admin-resources-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/semester-courses` | `UX-admin-semester-courses-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/semesters` | `UX-admin-semesters-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/settings` | `UX-admin-settings-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/settings/auth` | `UX-admin-settings-auth-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/students` | `UX-admin-students-01`, `SA-students-ux-17/19` | Registration options, college people filters and import history must all load before registration/bulk forms are offered; absent college skips private reads, outage has safe retry. `tests/unit/PROJ-BREAK-chat9-sa-students-page.test.tsx`. Browser/CSV writes and independent role matrix OPEN. |
| `/admin/tenants` | `UX-admin-tenants-01`, `SA-tenants-ux-09/11`, `SA-tenants-idor-58`, `SA-tenants-exports-12/14` | Typed hostile GET validation and authorization precede tenant reads; backend outages show safe retry preserving validated filters instead of false empty tenant list. `tests/unit/PROJ-BREAK-chat9-sa-tenant-directory-page.test.tsx`. Spreadsheet exports guard Unicode-obscured formulas, impose a 1000-row cap and reject duplicate/unknown filters (`tests/unit/PROJ-BREAK-chat9-sa-tenant-export-security.test.ts`). Live selected scope/database/browser verification OPEN. |
| `/admin/tenants/create` | `UX-admin-tenants-create-01`, `SA-tenants-create-08/11` | Authorized organizations are the sole college-creation destinations; forged/array preferred IDs cannot select another tenant. Directory outage disables creation and provides retry; disabled Super Admin denied before list. `tests/unit/PROJ-BREAK-chat9-sa-tenant-create-page.test.tsx`. Live browser/write integration OPEN. |
| `/admin/tenants/setup` | `UX-admin-tenants-setup-01`, `SA-tenants-setup-12/16` | Structure or launch readiness fetch failures return a safe retry before organization/college controls render; explicit no-college and disabled Super Admin role states. `tests/unit/PROJ-BREAK-chat9-sa-tenant-setup-page.test.tsx`. Real browser/readiness and source validation OPEN. |
| `/admin/verification` | `UX-admin-verification-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/videos` | `UX-admin-videos-01` | **OPEN** — no live/browser or full service-role journey confirmation |

## Findings and remediation in this lane

| Route | Evidence/fix |
| --- | --- |
| `/admin/projects` | Bad `page`/`pageSize`/status URLs failed as raw service errors; now typed parser and recovery link. `PROJ-BREAK-ux-10..13`. |
| `/admin/projects/at-risk` | Same shared at-risk page supports malformed URL recovery for Admin and College. `PROJ-BREAK-ux-14..16`. |
| `/admin/projects/submissions` | Same shared submissions page supports bounded filters and recovery; `PROJ-BREAK-ux-17..19`. |
| `/admin/projects/templates/[templateId]/resources` | Migrated tables to shared keyboard-scrolling `DataTable`/`ScrollCue`; corrected older local-DOM assertions; `UX-admin-scroll-motion-05`. |
| `/admin/settings` | Source audits exist for DataTable, modal and scroll cues; not live verified. |
| `/admin/students` | Source audits cover bulk selection and scroll cues; not live verified. |

The source inventory test now parses nested `(authenticated)` route group paths rather than truncating at the first `)`. All 37 route IDs are still checked against existing source files; full browser role/phone proof is open.

The original chat-9 CI failure list also flagged `SA-placements-projects-102` (quick-report drawer), `TPO-settings-audit-54/59` (confirmation flows) and `TPO-calendar-reports-53` (loading announcement). Tests now assert the shared native `Drawer`, `ConfirmDialog`, and `GracefulPageLoading` behaviors, rather than obsolete inline DOM controls. All changes are logged with commit SHA in `docs/audit/defects-chat-9.md`.

## Must complete before IIT Dharwad release

1. Exercise all 37 routes in an authenticated browser as Super Admin with no college, own selected college, a different college and expired/disabled memberships. Assert no data leakage or raw errors.
2. Execute every create/update/delete/export for each permitted role with duplicate submits, stale token, cross-tenant IDs and denied origin. Validate real PostgreSQL serialization, rollback and audit/notification single delivery.
3. Test mobile and keyboard paths including dialogs/drawers, visible horizontal scroll cues, focus restoration, reduced motion, print/export equivalence. The source-only route inventory is not this proof.
4. Obtain passing TypeScript and Vitest run and independent breaker review. No CI workflow was available to this session, so no pass claim is made.
