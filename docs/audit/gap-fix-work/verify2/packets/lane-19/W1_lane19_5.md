# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-2-006-020 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LS:247-272 after submissions title-only edits remain allowed
- Expected fix: Allow title-only corrections after submissions, lock other fields.

## G2-2-007-056 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LC:129-137 stats exception isolates row
- Expected fix: Provide partial stats fallback or explicit degraded mode with rows intact.

## G2-2-010-048 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LF:115-118 delete single override
- Expected fix: Implement effective precedence and granular reset.

## G2-2-013-035 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LC:83-102 recover from individually broken repo
- Expected fix: Isolate failures and preserve precision of '—' vs real zero.

## G2-2-014-049 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:25-37 audit explicitly targets course bulk status independent per course
- Expected fix: High-priority functional non-equivalence: name/API suggests course status but operation differs.

## G2-2-020-004 [P1] MISSING facet F01
- Files: src/app/api/projects/[projectId]/archive/route.ts
- Legacy: AdminProjectController.java:581-631 distinct delete and restore
- Expected fix: Restore deleted workspace state and discoverable recovery, separately from archive.

## G2-2-024-001 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/settings/page.tsx
- Legacy: AdminSmsLogController.java:33-38 GET /api/v1/admin/sms-log
- Expected fix: Add Super Admin SMS delivery-log page and API.

## G2-2-031-054 [P1] GAP facet F12
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: ClassServiceImpl.java:64-76 uniqueness by batch (or program without batch).
- Expected fix: Reconcile repeated section name across periods with legacy global-to-batch uniqueness for import.

## G2-13-028-012 [P1] GAP facet F04
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-140 Task fields key,priority,title,sprint,estimate,type,dueLabel,description,doneWhen,approach
- Expected fix: Map all ten plan fields to edit/display schema; keep distinct dueLabel vs dueDate and acceptance criteria.

## G2-13-028-015 [P1] GAP facet F04
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 tasksToken loaded from original workspace snapshot
- Expected fix: Support section-level optimistic token with admin plan save.

## G2-13-028-036 [P1] GAP facet F10
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:57-60 refreshWorkspaceForSave merges fresh sibling sections
- Expected fix: Avoid overwriting sprints/resources/meetings when submitting only tasks.

## G2-2-001-021 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LD:220-224 Assigned to, maxLength=100, placeholder Name or agent, disabled unless changed
- Expected fix: Cap assignee at 100 and restore placeholder/unchanged-disabled state.

## G2-2-003-012 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LC:36-40 TEMP_ID_PLACEHOLDER treated missing at startup
- Expected fix: Reject literal placeholder value across all email send paths.

## G2-20-030-055 [P1] GAP facet F11
- Files: src/app/(authenticated)/teacher/profile/page.tsx, src/app/(authenticated)/teacher/profile/details/page.tsx
- Legacy: Legacy teacher-only role excludes mentor; wrong roles redirect without rendering profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:20-25`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:39-55`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:113-115`)
- Expected fix: Explicitly ensure role eligibility and redirect parity for ADMIN/MENTOR/LEARNER

## G2-12-023-012 [P1] GAP facet F04
- Files: src/modules/announcements/tpo-placement-write-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:37-76`
- Expected fix: Legacy Audience ALL means learners in college and defaults PLACEMENTS in old composer, while vNext COLLEGE audience includes active college memberships beyond learners; inspect notification target eligibility.

## G2-13-029-055 [P1] GAP facet F22
- Files: src/modules/placements/tpo-batch-workspace-read-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:53-57`
- Expected fix: Legacy numeric batchId/class IDs and batch state/eligibility counts, vNext cohort UUID, section membership decisions and lifecycle; map carefully.

## G2-15-031-060 [P1] GAP facet F22
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-120`
- Expected fix: Numeric course/class/lesson ID and Redux vs UUID delivery, enrollment and membership schema.

## G2-3-003-021 [P1] GAP facet F06
- Files: src/components/courses/learner-quiz-attempt.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:1040-1065`
- Expected fix: Legacy supports `Word`, `Description` and misspelled `Discription` input types; new payload/types cover only SINGLE_CHOICE/MULTIPLE_CHOICE. Confirm legacy data migration is intentionally omitted, and gate unsupported legacy links.

## G2-3-003-034 [P1] GAP facet F10
- Files: src/components/courses/learner-quiz-attempt.tsx, src/modules/courses/quiz-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:12-24`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:513-531`
- Expected fix: Legacy sends `shownQuestionIds` list to reject assessment changed mid-attempt; vNext does not send/validate it because published content is immutable. Confirm immutable guarantee and error mapping before declaring parity.

## G2-3-003-038 [P1] GAP facet F11
- Files: src/components/courses/learner-quiz-attempt.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:256-264`
- Expected fix: Legacy storage key scopes to user/role/college/org/class, vNext scopes only quizId and deliveryId. Verify account-switch same-browser draft isolation, ensure membership/user partition.

## G2-3-003-058 [P1] GAP facet F20
- Files: src/components/courses/learner-quiz-attempt.tsx
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:256-295`
- Expected fix: New draft storage key does not include account/college membership; revise to protect against cross-login stale answers and quizId collision.

## G2-3-029-031 [P1] GAP facet F10
- Files: src/components/projects/project-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-140`
- Expected fix: Legacy delivery view read-only; vNext ADMIN adds review/evaluation/reopen controls on this page. Owner to decide if intentionally functional expansion, ensure no accidental write paths in clone view.

## G2-3-023-031 [P1] GAP facet F15
- Files: src/modules/placements/tpo-drive-publish-effects.ts, src/modules/placements/tpo-drive-lifecycle-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- Expected fix: Legacy eligible APP+EMAIL default; VNext only in-app and explicit email unavailable. Restore approved channel or document removal.

## G2-4-021-038 [P1] GAP facet F11
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: Legacy reporterAccess relation establishes reporter ownership. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- Expected fix: Enable approved reporter status lookup or clearly document intentionally disabled external access.

## G2-4-031-037 [P1] GAP facet F10
- Files: src/modules/colleges/admin-signin-policy-service.ts
- Legacy: Fetch tenant branding by collegeId, coerces old enum (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:97-100`)
- Expected fix: Backfill/translate branding login_methods to new policy table.
