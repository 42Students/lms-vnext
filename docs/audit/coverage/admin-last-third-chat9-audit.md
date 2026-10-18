# Chat-9 Super Admin last-third source audit — 18 October 2026

Scope: 37 routes (positions 75–111) of `docs/orchestrator/ui-ux/pages-admin.md`. Every route has a named source contract in `tests/unit/ux-admin-chat9-batch-01..04.test.ts`, and `tests/unit/ux-admin-chat9-coverage-closure.test.ts` checks the mapping. These **source tests do not certify** interactive, responsive, a11y, authorization, state or database behavior. Do not present as a completed release audit.

## Route inventory

| Route | Source-contract test | Live behavior / role/phone audit |
| --- | --- | --- |
| `/admin/placements/shortlisted` | `UX-admin-placements-shortlisted-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/placements/shortlisted/[applicationId]` | `UX-admin-placements-shortlisted-application-id-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/placements/student-lookup` | `UX-admin-placements-student-lookup-01`, `SA-placements-student-lookup-01/04` | Malformed/overlong/repeated queries show a safe reset, do not touch DB; valid 3–150 character selected-college searches only; absent college denies queries. `tests/unit/PROJ-BREAK-chat9-sa-student-lookup-recovery.test.tsx`. Browser/real tenant test still OPEN. |
| `/admin/programs` | `UX-admin-programs-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects` | `UX-admin-projects-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/[projectId]` | `UX-admin-projects-project-id-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/[projectId]/[section]` | `UX-admin-projects-project-id-section-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/[projectId]/readiness` | `UX-admin-projects-project-id-readiness-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/at-risk` | `UX-admin-projects-at-risk-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/audit` | `UX-admin-projects-audit-01` + `PROJ-BREAK-ux-22..26` + `PROJ-BREAK-idor-24..26` | Invalid URL recovery, global Super Admin-only template activity, selected-scope isolation, actual remaining-page counter. **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/readiness` | `UX-admin-projects-readiness-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/reassign-mentor` | `UX-admin-projects-reassign-mentor-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/submissions` | `UX-admin-projects-submissions-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates` | `UX-admin-projects-templates-01`, `PROJ-BREAK-ux-30/33` | Permission-denied and DB-outage recovery, malformed filters, exact scoped empty state in server element-tree tests (`tests/unit/PROJ-BREAK-chat9-template-directory-page.test.tsx`); live browser and full role matrix OPEN |
| `/admin/projects/templates/[templateId]` | `UX-admin-projects-templates-template-id-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/colleges` | `UX-admin-projects-templates-template-id-colleges-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/overview` | `UX-admin-projects-templates-template-id-overview-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/resources` | `UX-admin-projects-templates-template-id-resources-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/sprints` | `UX-admin-projects-templates-template-id-sprints-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/tasks` | `UX-admin-projects-templates-template-id-tasks-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/versions` | `UX-admin-projects-templates-template-id-versions-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/[templateId]/versions/[versionId]` | `UX-admin-projects-templates-template-id-versions-version-id-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/templates/new` | `UX-admin-projects-templates-new-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/projects/workspaces/new` | `UX-admin-projects-workspaces-new-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/quizzes` | `UX-admin-quizzes-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/recruiters` | `UX-admin-recruiters-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/resources` | `UX-admin-resources-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/semester-courses` | `UX-admin-semester-courses-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/semesters` | `UX-admin-semesters-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/settings` | `UX-admin-settings-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/settings/auth` | `UX-admin-settings-auth-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/students` | `UX-admin-students-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/tenants` | `UX-admin-tenants-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/tenants/create` | `UX-admin-tenants-create-01` | **OPEN** — no live/browser or full service-role journey confirmation |
| `/admin/tenants/setup` | `UX-admin-tenants-setup-01` | **OPEN** — no live/browser or full service-role journey confirmation |
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
