# Chat-9 Projects admin/college breaker ledger (IIT Dharwad)

Date: 2026-10-18. **Targeted inventory: 65 exported functions/route handlers/pages** across admin/college services; **not** the full Projects module. Chat-14 is explicitly the lead for `docs/audit/coverage/projects-ledger.md` and must merge this inventory into the full per-export ledger. Nothing in this file claims 90%+ branch coverage or passing integration tests.

**Evidence category**: PURE BEHAVIOR means a unit test directly calls the exported function with hostile values. SOURCE means an adversarial source/route invariant asserts scoped filters, locks, CSRF, archiving, notification dedupe etc.; database-backed role matrix, idempotency, stale-version and failure replay are **outstanding** for that entry, not implicitly waived. A row points to its related tests and has an honest unresolved item instead of a fake passed status.

| File | Export/route/page | Regression cases (`tests/unit/proj-break-chat9-*.test.ts`) | Depth and remaining acceptance |
|---|---|---|---|
| `src/modules/projects/template-subview-service.ts` | `getSuperAdminTemplateSubview` | `PROJ-BREAK-scale-27; PROJ-BREAK-idor-20; PROJ-BREAK-ux-18` | MOCK BEHAVIOR: current-only read, no full history, permission denial; DB read and tab UX pending |
| `src/modules/projects/template-version-comparison-service.ts` | `getSuperAdminTemplateVersionComparison` | `PROJ-BREAK-scale-24; PROJ-BREAK-idor-18/19` | MOCK BEHAVIOR: 2-row bound, missing/cross-template rejection, role denied, SQL template predicate; DB EXPLAIN pending |
| `src/modules/projects/super-admin-template-directory-service.ts` | `listSuperAdminTemplateDirectory` | `PROJ-BREAK-scale-22/23` | SOURCE: current-version-only bounded JSON read; PURE BEHAVIOR: strict paging; DB EXPLAIN pending |
| `src/modules/projects/template-metadata-edit-service.ts` | `editSuperAdminTemplateMetadata` | `PROJ-BREAK-idor-14; PROJ-BREAK-races-08/09` | SOURCE: transactional persisted-actor check, PURE BEHAVIOR: CAS/state/schema; DB revoke-race pending |
| `src/modules/projects/template-service.ts` | `listProjectTemplates` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `getProjectTemplateDetail` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `getAssignedProjectTemplateDetail` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `createProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `reviseProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `publishProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `unpublishProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `duplicateProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `archiveProjectTemplate` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `assignProjectTemplateToCollege` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `revokeProjectTemplateFromCollege` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/template-service.ts` | `listAssignedProjectTemplates` | `PROJ-BREAK-races-05` | SOURCE: publication CAS / permission; DB matrix pending |
| `src/modules/projects/instance-service.ts` | `createProjectInstance` | `PROJ-BREAK-idor-12` | SOURCE: active roster/college scope; DB matrix pending |
| `src/modules/projects/instance-service.ts` | `listProjectInstances` | `PROJ-BREAK-idor-12` | SOURCE: active roster/college scope; DB matrix pending |
| `src/modules/projects/instance-service.ts` | `archiveProjectInstance` | `PROJ-BREAK-idor-12` | SOURCE: active roster/college scope; DB matrix pending |
| `src/modules/projects/instance-service.ts` | `getProjectInstanceWorkspace` | `PROJ-BREAK-idor-12` | SOURCE: active roster/college scope; DB matrix pending |
| `src/modules/projects/college-project-roster-service.ts` | `replaceCollegeProjectLearners` | `PROJ-BREAK-idor-15/16/17` | SOURCE: persisted actor and academic program/section membership filters; PURE BEHAVIOR: roster input schema; DB matrix pending |
| `src/modules/projects/college-project-summary-service.ts` | `updateCollegeProjectSummary` | `PROJ-BREAK-races-04` | SOURCE: row-lock + CAS; DB race pending |
| `src/modules/projects/admin-readiness-overrides-service.ts` | `listCollegeActiveReadinessOverrides` | `PROJ-BREAK-archive-01` | SOURCE: archived filter; DB fixtures pending |
| `src/modules/projects/college-readiness-releases-service.ts` | `listCollegeReadinessWorkspaceChoices` | `PROJ-BREAK-archive-02` | SOURCE: archive and college filter; DB fixtures pending |
| `src/modules/projects/college-readiness-releases-service.ts` | `listCollegeReadinessReleases` | `PROJ-BREAK-archive-02` | SOURCE: archive and college filter; DB fixtures pending |
| `src/modules/projects/admin-unsubmitted-service.ts` | `listProjectAdminUnsubmitted` | `PROJ-BREAK-archive-03` | SOURCE: archive and unsubmitted query; DB fixtures pending |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminSnapshots` | `PROJ-BREAK-ux-01` | SOURCE: project admin render + scopes; DB fixture pending |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminRiskQueue` | `PROJ-BREAK-ux-01` | SOURCE: project admin render + scopes; DB fixture pending |
| `src/modules/projects/admin-insights-service.ts` | `getProjectAdminSubmissionSummary` | `PROJ-BREAK-ux-01` | SOURCE: project admin render + scopes; DB fixture pending |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminSubmissionQueue` | `PROJ-BREAK-ux-01` | SOURCE: project admin render + scopes; DB fixture pending |
| `src/modules/projects/admin-submission-review-service.ts` | `lockAdminProjectSubmission` | `PROJ-BREAK-state-03` | MODEL gate, DB mutation fixture pending |
| `src/modules/projects/evaluation-service.ts` | `createProjectEvaluation` | `PROJ-BREAK-grading-01` | SOURCE: approved-only and uniqueness; DB fixture pending |
| `src/modules/projects/evaluation-service.ts` | `getProjectEvaluation` | `PROJ-BREAK-grading-01` | SOURCE: approved-only and uniqueness; DB fixture pending |
| `src/modules/projects/evaluation-service.ts` | `listProjectEvaluations` | `PROJ-BREAK-grading-01` | SOURCE: approved-only and uniqueness; DB fixture pending |
| `src/modules/projects/instance-restore-service.ts` | `restoreProjectInstance` | `PROJ-BREAK-restore-01` | SOURCE: CAS/primary mentor; DB race pending |
| `src/modules/projects/project-resource-file-service.ts` | `toProjectFileDto` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `issueProjectFileUploadGrant` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `completeProjectFileUpload` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `listProjectFiles` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `updateProjectFileDetails` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `removeProjectFile` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-resource-file-service.ts` | `issueProjectFileDownloadGrant` | `PROJ-BREAK-files-01/02/03/04` | SOURCE: storage/locks; storage failure integration pending |
| `src/modules/projects/project-notification-service.ts` | `projectNoticeHref` | `PROJ-BREAK-notifications-01` | SOURCE: recipient dedupe and college filter; delivery integration pending |
| `src/modules/projects/project-notification-service.ts` | `notifyActiveProjectMembers` | `PROJ-BREAK-notifications-01` | SOURCE: recipient dedupe and college filter; delivery integration pending |
| `src/modules/projects/project-notification-service.ts` | `notifyProjectMemberships` | `PROJ-BREAK-notifications-01` | SOURCE: recipient dedupe and college filter; delivery integration pending |
| `src/modules/projects/class-team-workspace-service.ts` | `createClassTeamWorkspaces` | `PROJ-BREAK-idor-13` | SOURCE: serializable team creation; PostgreSQL fixture pending |
| `src/modules/projects/project-template-catalogue-model.ts` | `projectTemplateSectionCounts` | `PROJ-BREAK-exports-01/02; PROJ-BREAK-reports-01` | PURE BEHAVIOR |
| `src/modules/projects/project-template-catalogue-model.ts` | `projectTemplateCatalogueCsv` | `PROJ-BREAK-exports-01/02; PROJ-BREAK-reports-01` | PURE BEHAVIOR |
| `src/modules/projects/college-project-summary-model.ts` | `collegeProjectStatusChangeAllowed` | `PROJ-BREAK-state-01/02; PROJ-BREAK-deadlines-02` | PURE BEHAVIOR |
| `src/modules/projects/class-team-split-model.ts` | `previewClassTeams` | `PROJ-BREAK-races-03; PROJ-BREAK-tenancy-01` | PURE BEHAVIOR |
| `src/modules/projects/class-team-split-model.ts` | `movePreviewMember` | `PROJ-BREAK-races-03; PROJ-BREAK-tenancy-01` | PURE BEHAVIOR |
| `src/modules/projects/class-team-capacity.ts` | `classTeamCapacity` | `PROJ-BREAK-scale-01` | PURE BEHAVIOR |
| `src/modules/projects/template-version-comparison-model.ts` | `compareTemplateVersionSnapshots` | `PROJ-BREAK-versions-01/02` | PURE BEHAVIOR |
| `src/modules/projects/template-version-comparison-model.ts` | `templateVersionComparisonHref` | `PROJ-BREAK-versions-01/02` | PURE BEHAVIOR |
| `src/modules/projects/readiness-overrides-export-model.ts` | `projectReadinessOverrideCsvCell` | `PROJ-BREAK-exports-04/05` | PURE BEHAVIOR |
| `src/app/api/projects/class-team-workspaces/route.ts` | `POST` | `PROJ-BREAK-routing-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/api/projects/templates/[templateId]/publish/route.ts` | `POST` | `PROJ-BREAK-routing-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/api/projects/[projectId]/readiness/override/route.ts` | `POST` | `PROJ-BREAK-routing-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/evaluation/route.ts` | `GET + POST` | `PROJ-BREAK-routing-01; PROJ-BREAK-grading-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/api/projects/[projectId]/resource-files/[fileId]/download-grant/route.ts` | `POST` | `PROJ-BREAK-routing-01; PROJ-BREAK-files-03` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/api/projects/readiness-overrides/export/route.ts` | `GET` | `PROJ-BREAK-exports-05` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/(authenticated)/admin/projects/page.tsx` | `Page` | `PROJ-BREAK-ux-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |
| `src/app/(authenticated)/college/projects/page.tsx` | `Page` | `PROJ-BREAK-ux-01` | SOURCE: route or page invariant; runtime denied/empty/error journey pending |

## Whole-product acceptance remaining (no waivers authorized)

- Remaining Projects exports outside chat-9's selected service slice: assigned to chat-14 and other squad owners per the hardening brief. `WEAK-AREAS.md` identifies 14 project source files without a reference prior to this round.
- PostgreSQL integration: wrong-college/organization roles, expired sessions, stale tabs, concurrent template version/roster mutation, serializable retry, archive-vs-file mutation, FK/check/cascade, realistic migrations; EXPLAIN/1,000+ cases.
- Storage: content type/size, signed URL expiry, quarantine, interrupted upload/retry and orphan cleanup.
- Real notification delivery/outbox dedupe and audience, grading/release visibility, CSV application import, accessibility on all account pages.
- Run `npm run typecheck`, `npm run lint`, `npx vitest run tests/unit/proj-break-chat9-*.test.ts` and connected DB suites. **Not executed here.**

| `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` | `Page` | `PROJ-BREAK-ux-14` | SOURCE: college-scope guard, safe retry and denied state; browser outage/revocation journey pending |

| `src/components/projects/super-admin-template-subview-page.tsx` | `SuperAdminTemplateSubviewPage` | `PROJ-BREAK-ux-15; PROJ-BREAK-scale-28` | SOURCE: 404 vs safe error fallback, history-page parser; server render/outage journey pending |
