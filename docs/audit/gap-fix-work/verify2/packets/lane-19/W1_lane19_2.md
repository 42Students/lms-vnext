# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-015-046 [P1] GAP facet F10
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:605-703 — GET detail and PUT status within same JobApplication model.
- Expected fix: Join audit detail fields and ensure consistency.

## G2-10-015-082 [P1] GAP facet F21
- Files: src/components/placements/college-application-detail-drawer.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:755-935 — Interview scheduling and results in application details.
- Expected fix: Restore in-context route/actions.

## G2-10-020-015 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/programs/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:303-306 — Cached-data fetch error yellow warning and Retry.
- Expected fix: Show stale verified prior rows when refresh fails same tenant.

## G2-10-029-014 [P1] GAP facet F04
- Files: src/components/projects/super-admin-template-plan-editor.tsx, src/modules/projects/validation.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:97-104 — sprint may be empty (backlog) with saved-sprint options.
- Expected fix: Support null/omitted sprint in schema and UI to restore backlog.

## G2-10-029-020 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-91 — key optional text with slug preview.
- Expected fix: Make key optional with stable generated slug/key uniqueness.

## G2-10-029-022 [P1] GAP facet F06
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:99-104 — optional Sprint select with backlog placeholder.
- Expected fix: Include backlog none/clear state.

## G2-10-029-024 [P1] MISSING facet F06
- Files: src/components/projects/super-admin-template-plan-editor.tsx, src/modules/projects/validation.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:117-125 — Type STORY/BUG/CHORE/SPIKE.
- Expected fix: Add persisted type field and select.

## G2-10-029-036 [P1] GAP facet F10
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:79-88 and docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:323-346 — only tasks replaced; generated key and orphan sprint cleared.
- Expected fix: Avoid incidental changes to other blueprint sections; retain backlog/key support.

## G2-10-029-038 [P1] GAP facet F12
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:35-38,79-85 — tasks can exist without saved sprints (backlog); deleted sprint unlink on save.
- Expected fix: Implement nullable sprint/backlog and orphan relinking.

## G2-10-029-049 [P1] GAP facet F19
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-103 — search appears above 12 rows for manageable edit.
- Expected fix: Use virtualized/collapsible/search editor to keep 500+ task performance stable.

## G2-10-029-051 [P1] MISSING facet F20
- Files: src/components/projects/super-admin-template-plan-editor.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/useUnsavedFormGuard.js:17-55 — unsaved changes guard on reload and client route/tab changes.
- Expected fix: Reinstate unsaved-change guard for tab/back/reload.

## G2-10-029-056 [P1] GAP facet F22
- Files: src/modules/projects/validation.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-142 — legacy taskType,dueLabel,approach and optional sprint/key.
- Expected fix: Extend validation, DB JSONB version parser and migration to preserve data.

## G2-10-023-071 [P1] GAP facet F14
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:163-236 — Branding logo upload/preview within identity.
- Expected fix: Render branding file controls inline, respect existing signed URL policies

## G2-17-030-025 [P1] GAP facet F07
- Files: src/components/placements/placement-operations-workspace.tsx
- Legacy: Job load error exact `Couldn't load drives. Check your connection and retry.`; DrivesLanding.js:126-133
- Expected fix: Wrap jobs fetch independently; show failed load with Retry without erasing policy or other successful data.

## G2-11-001-011 [P1] GAP facet F04
- Files: src/modules/placements/public-page/content-model.ts
- Legacy: Backend supplies only non-null selected values. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:112`
- Expected fix: Filter suppressed metrics entirely.

## G2-11-001-012 [P1] GAP facet F04
- Files: src/modules/placements/public-page/content-model.ts
- Legacy: Default numbers STUDENTS/PLACED/COMPANIES. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:51`
- Expected fix: Restore defaults/order with key migration.

## G2-11-001-051 [P1] GAP facet F12
- Files: src/modules/placements/public-page/content-model.ts
- Legacy: Privacy minimum group 5 per metric. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:29`
- Expected fix: Omit metric below five.

## G2-11-003-031 [P1] GAP facet F05
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Counts based on full returned drives including all lifecycles `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:148`
- Expected fix: Avoid double counting request+job for same drive

## G2-11-005-034 [P1] GAP facet F06
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: New composer defaults audience PLACEMENTS `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:53`
- Expected fix: Restore default students in placements, not entire college

## G2-11-007-022 [P1] GAP facet F04
- Files: src/modules/placements/tpo-company-hiring-pulse-model.ts
- Legacy: Legacy hiring per year counts distinct placed learners by **job creation year**, honoring college counts-as-placed rules. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:412`
- Expected fix: Decide intended KPI equivalence; preserve job-year/placed-rule figure on exact cloned surface.

## G2-11-008-056 [P1] GAP facet F11
- Files: src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx
- Legacy: Legacy URL opens operator experience for TPO. `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:33`
- Expected fix: Use selected TPO role, not implicit learner priority.

## G2-18-016-001 [P1] MISSING facet F01
- Files: src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts
- Legacy: QuizController.java:123-153 has get-for-attempt, submit, manager submissions, global optional-filter learner my-submissions
- Expected fix: Build authenticated all-quiz learner attempt-history index/route; map old links safely rather than accepting numeric IDs

## G2-19-019-007 [P1] GAP facet F03
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: FacultyTeachingAssignmentController.java:98-190 Create, Bulk, Update, Delete, Deactivate controls
- Expected fix: Restore reachable Create, Create bulk, Edit Role and Deactivate actions with correct confirmation, or name replacement entry points

## G2-13-012-029 [P1] GAP facet F13
- Files: src/modules/placements/public-join/error-copy.ts, src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:58-59` DNS failure results UNKNOWN; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:101-102` caller accepts UNKNOWN
- Expected fix: Specify transient DNS UX and offer resilient retry without misreporting NO_MAIL

## G2-13-012-039 [P1] GAP facet F18
- Files: src/modules/placements/public-join/error-copy.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:11-12` UNKNOWN has no user-facing blocking warning
- Expected fix: Avoid presenting temporary DNS uncertainty as a definitive bad email
