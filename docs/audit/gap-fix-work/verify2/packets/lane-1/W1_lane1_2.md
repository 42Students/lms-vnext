# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-028-042 [P1] GAP facet F20
- Files: src/components/projects/workspace-brief-editor.tsx
- Legacy: Old resetFields on load/refresh and dirty route guard; overview.js:46-67;useUnsavedFormGuard.js:17-56
- Expected fix: Reset form on new workspace and block stale/unsaved navigation

## G2-15-002-038 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Profile save success `${label} updated`; skills `Saved`, `Removed`, `Added` toasts (`ProfileSectionsPanel.js:264-271,362-369,374-381,400-409`).
- Expected fix: Restore all per-action toasts only after confirmed server writes.

## G2-15-004-039 [P1] GAP facet F10
- Files: src/modules/projects/member-service.ts
- Legacy: Legacy GET `/api/v1/projects/me/page` with page0,size25,search,status,attention returns records+totalRecords (projectService.js:6-13; ProjectWorkspaceController.java:91-101; ProjectsContent.jsx:205-214)
- Expected fix: Implement bounded DB-level pagination and equivalent filter contract

## G2-15-005-042 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy apply POST sends job ID, learner ID, resumeUrl (JobDetailContent.jsx:572-573; jobService.js:60-66)
- Expected fix: Create migration contract for resume attachment and role selection, document intentional data drop if no resumes

## G2-15-008-015 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy progress from getLessonContentProgress and submitted assignment IDs, completion counts all displayed items (syllabusDetail.js:119-137,182-201,494-515)
- Expected fix: Compute selected-lesson completed/total and exact Continue next incomplete semantics

## G2-16-003-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/tracker/issues/[publicId]/page.tsx
- Legacy: `[issueId].js:129-134,262`: public `/tracker/issues/[issueId]` in standalone TrackerShell, back `← All issues`.
- Expected fix: Provide privacy-approved read-only report detail for reporter/public, while retaining separate admin edit controls.

## G2-16-007-079 [P1] GAP facet F23
- Files: src/app/(authenticated)/college/semester-courses/page.tsx
- Legacy: `semester-courses.js:18-29`: missing-college warning preserved.
- Expected fix: Restore actionable warning for authenticated unassigned admin.

## G2-17-018-006 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: src/components/courses/faculty-content-order-editor.tsx:106-117 — vNext badge `Migration pending` when disabled.
- Expected fix: Register DB05 delivery order migration and remove disabled state after acceptance.

## G2-18-005-052 [P1] GAP facet F11
- Files: src/app/(authenticated)/learn/my-placements/page.tsx
- Legacy: Legacy acceptance may mark placed only if countsAsPlaced not false/0. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:58-61`
- Expected fix: Apply countsAsPlaced rule before placed-state banner, avoid false placed label.

## G2-19-004-046 [P1] GAP facet F11
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy only booked/live/nonpast/non-talk rounds can send confirm or reschedule `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-104`
- Expected fix: Hide/disable reschedule where not booked or not eligible and enforce server rules.

## G2-2-006-027 [P1] MISSING facet F07
- Files: (none, new feature)
- Legacy: LS:127-149 precise file key, MIME, size and unavailable checks
- Expected fix: Port field and server errors for bad file metadata and storage outage.

## G2-2-008-014 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LC:83 upfront ensureCanViewOrGradeAssignment prevents ID leakage
- Expected fix: Authorize selected assignment + section before listing/fetching any learner IDs.

## G2-2-011-015 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LC:148-154 cap200 OCCURRENCES, not overall day span
- Expected fix: Enforce 200 occurrences and academic term instead of arbitrary 93 days if owner demands legacy parity.

## G2-2-013-039 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:75-102 independent fault isolation
- Expected fix: Separate summary dependency from unrelated setup metrics.

## G2-2-015-061 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/course-progress/page.tsx
- Legacy: The legacy route is a single direct class/course report `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-245`
- Expected fix: Make class+course measured completion the primary Super Admin surface; preserve directory as a secondary view

## G2-2-020-039 [P1] GAP facet F10
- Files: src/modules/projects/instance-service.ts
- Legacy: AdminProjectController.java:499-525 attach template to existing workspace
- Expected fix: Offer attach for unbound historical workspaces or explicit migration exception.

## G2-2-020-044 [P1] GAP facet F12
- Files: src/modules/projects/instance-service.ts
- Legacy: AdminProjectController.java:555-631 archive/delete/restore distinct lifecycle operations
- Expected fix: Model deleted state distinctly from archived and preserve recoverable content.

## G2-2-024-018 [P1] MISSING facet F08
- Files: src/app/(authenticated)/admin/settings/page.tsx
- Legacy: AdminSmsLogController.java:22-31 purpose answer was absence SMS actually sent?
- Expected fix: Show explicit accepted/failed/unknown attempt status, not generic success.

## G2-2-001-024 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LD:166-177 duplicate picker suggests server similarity candidates; LD:183-191 optional id free-entry
- Expected fix: Accept finding external IDs and server-provided similarity suggestions, not DB UUIDs.

## G2-2-003-017 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LC:55-60 getTemplateId(event) returns opaque ID for dispatcher
- Expected fix: Implement explicit legacy-event dispatch adapter with complete channel and merge-variable coverage.

## G2-20-030-062 [P1] GAP facet F13
- Files: src/app/(authenticated)/teacher/profile/page.tsx
- Legacy: Refresh preserves last profile + RefreshStatus and warning on failure (`docs/legacy-source/frontend/src/pages/teacher/profile.js:145-161`)
- Expected fix: Preserve previous verified profile on refresh errors where safe

## G2-18-017-019 [P1] GAP facet F10
- Files: src/modules/projects/member-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- Expected fix: Legacy revive deleted row instead of insert due hard unique triple; vNext add inserts new row after previous endedAt.

## G2-3-018-021 [P1] GAP facet F10
- Files: src/modules/projects/submission-service.ts, src/modules/projects/admin-submission-review-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:16-47`
- Expected fix: Legacy single project_delivery_event history records broad actions, statuses and snapshots; vNext technical append-only event inserts only attachment change/lock/reopen. Record submission, draft save, review and feedback chronology via combined history.

## G2-3-004-029 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/quizzes/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`
- Expected fix: Legacy `key=selectedCollegeId` remounts Quizzes on scope switch and wipes pending controls; vNext SSR reload may preserve inline client state. Key creator by scope or reset state explicitly.

## G2-4-006-005 [P1] GAP facet F03
- Files: src/components/projects/project-admin-submissions-page.tsx
- Legacy: Three quick-filter cards Pending review, Needs student action, Reviewed act as toggles. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:72-78;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:684-697`)
- Expected fix: Rebuild three exact quick-filter buckets with server counts and toggle chips.
