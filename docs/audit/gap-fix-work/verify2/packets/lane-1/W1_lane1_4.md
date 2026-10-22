# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-009-035 [P1] GAP facet F10
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Review POST adminReviewProjectDelivery with `{delivery:{feedback,version,submitAction}}`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:307-328`)
- Expected fix: Ensure version-based optimistic concurrency and only latest-submission write.

## G2-4-009-038 [P1] GAP facet F11
- Files: src/components/projects/project-admin-submissions-page.tsx, src/components/projects/project-admin-submission-review.tsx
- Legacy: Legacy Lock permission shown for every admin with submitted delivery, guards backend status. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:875-892`)
- Expected fix: Decide SuperAdmin exemption if old allowed, preserve no privilege regression.

## G2-4-009-047 [P1] MISSING facet F14
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Not submitted export `project-not-submitted.csv`, Workspace,Mentor,Status,Progress,Inactive. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:710-738`)
- Expected fix: Add unsubmitted CSV control and matching columns/filename.

## G2-4-009-060 [P1] GAP facet F20
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Review error 409 reloads same project, updates feedback/status version; otherwise closes if absent. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:334-349`)
- Expected fix: Implement 409 re-fetch/collision handling.

## G2-4-009-062 [P1] GAP facet F21
- Files: src/components/projects/project-admin-submission-review.tsx
- Legacy: Old Java API `adminReviewProjectDelivery` checks acting SA college, uses version in delivery JSON. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:302-328`)
- Expected fix: Verify tenant/role/CAS and audit parity at new handlers.

## G2-4-009-064 [P1] GAP facet F22
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Old project delivery JSON includes reviewStatus, submittedAt, revisionCount, feedback, reviewedByName/Type, attachmentUrl. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:31-75;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:379-518`)
- Expected fix: Map old revisions, status, reviewer type and URL fields explicitly through migration.

## G2-4-028-037 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: People redirect drops c/m/extra params (`docs/legacy-source/frontend/src/pages/tpo/team.js:8`)
- Expected fix: Prioritize tab people redirect before c/m.

## G2-14-028-012 [P1] GAP facet F04
- Files: src/components/projects/college-project-summary-editor-full.tsx, src/components/projects/project-workspace.tsx
- Legacy: Legacy Overall progress bar computed or hand-set when empty. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:94-99`
- Expected fix: Show derived progress and disable hand setting when task data available.

## G2-14-028-020 [P1] GAP facet F06
- Files: src/components/projects/college-project-summary-editor-full.tsx
- Legacy: Legacy status select, progress derived displays read-only bar. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:539-555`
- Expected fix: Honor calculated-progress semantics.

## G2-14-028-031 [P1] MISSING facet F09
- Files: src/components/projects/college-project-summary-editor-full.tsx
- Legacy: Legacy Change template Modal with destructive warning, template search, reapply checkbox. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:451-485`
- Expected fix: Implement modal with explicit task/sprint/resource replacement warning.

## G2-14-028-039 [P1] MISSING facet F11
- Files: src/components/projects/college-project-summary-editor-full.tsx
- Legacy: Legacy selects only published templates when replacing. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:147-159`
- Expected fix: Gate attach by published/assigned template, college scope.

## G2-5-002-045 [P1] GAP facet F12 Business rules
- Files: (none, new feature)
- Legacy: Conflicts computed before user filters. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- Expected fix: Evaluate all tenant-scoped active interviews first.

## G2-5-006-035 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: On click GET exact attendance record before correction (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-259)
- Expected fix: Revalidate record on open and block stale corrections.

## G2-5-008-035 [P1] GAP facet F07 Validation/errors
- Files: (none, new feature)
- Legacy: Could not load programs/batches shows Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- Expected fix: Catch data/option failures separately with retry.

## G2-5-010-014 [P1] GAP facet F04 Data formatting
- Files: (none, new feature)
- Legacy: Program or Batch missing displays Name unavailable (ID X) (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-395)
- Expected fix: Include broken refs with explicit fallback, don't hide rows.

## G2-5-028-007 [P1] MISSING facet F03
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy actions per row: View, Assign Mentor, Assign Learners, Archive, Delete. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:523-590`
- Expected fix: Restore per-row mentor assignment, learners assignment and soft-delete actions.

## G2-5-028-012 [P1] GAP facet F04
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy 8 table columns Project, Course, Mentor, Phase, Progress, Status, Due, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:523-551`
- Expected fix: Reintroduce Course, Phase and Due columns and original order.

## G2-5-028-020 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy Create form defaults IN_PROGRESS, Planning, progress0, blank learners. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:216-225,817-885`
- Expected fix: Document status transition and map existing defaults deliberately.

## G2-5-028-022 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy Class and Mentor both required with remote-search picker. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:827-847`
- Expected fix: Decide optional role parity and restore typeahead for large colleges.

## G2-5-028-024 [P1] GAP facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy phase free-text, status four values, progress0..100. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:861-876`
- Expected fix: Restore phase/progress edit contract or map explicitly to workspace summary.

## G2-5-028-025 [P1] MISSING facet F06
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy Due Label max80, Blocker and Next Action textareas. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:877-885`
- Expected fix: Add those optional project fields or approved subsequent editor.

## G2-5-028-027 [P1] GAP facet F07
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy backend title required max160, courseLabel max160, progress0..100, dueLabel max80. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-37`
- Expected fix: Reconcile DTO length/rules and define one migration validation policy.

## G2-5-028-035 [P1] GAP facet F08
- Files: src/components/projects/project-create-control.tsx
- Legacy: Legacy unsaved modal close prompts `Discard unsaved changes?`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:390-396`
- Expected fix: Add unsaved-change guard for create/assign dialogs.

## G2-5-028-037 [P1] MISSING facet F09
- Files: src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy Assign Mentor modal with Select remote search and Role label `Project Mentor`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:715-753`
- Expected fix: Offer assign modal or reachable inline action linked to Team.

## G2-5-028-038 [P1] GAP facet F09
- Files: src/components/projects/project-create-control.tsx, src/components/projects/project-admin-workspace-list.tsx
- Legacy: Legacy Assign Learners 760px modal with replaceExisting checkbox. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:755-798`
- Expected fix: Restore replace-existing selected-member confirmation.
