# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-022-009 [P1] GAP facet F04
- Files: src/modules/placements/tpo-students-service.ts
- Legacy: Legacy StudentSummaryDTO sends `contactMobile` and resumeUrl `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/StudentSummaryDTO.java:22-41`
- Expected fix: Provide authorized need-to-know action/receipt rather than expose raw URL.

## G2-5-022-044 [P1] GAP facet F19
- Files: src/modules/placements/tpo-students-service.ts
- Legacy: Legacy list max5000, no pagination beyond first page `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:37-48`
- Expected fix: Push filters/count/paging into SQL for 10k+ learners.

## G2-5-022-048 [P1] GAP facet F22
- Files: src/modules/placements/tpo-students-service.ts
- Legacy: Legacy academic record decimals and learnerId PK `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:15-78`
- Expected fix: Map all academic fields with scale/rounding and verified metadata.

## G2-5-030-028 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx
- Legacy: Legacy Modal.confirm triggered by Drawer close if any child dirty, danger Discard. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:73-80`
- Expected fix: Implement overarching unsaved changes confirm with exact copy.

## G2-6-020-022 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: Legacy optional chair and vice chair validated for same college (DepartmentServiceImpl.java:97-115).
- Expected fix: When leadership returns, require faculty record active and college match on both roles.

## G2-6-027-059 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy JobApplication entity foreign keys, applicationStatus and appliedAt (JobController.java:401-447; JobApplicationRepository.java:42-52).
- Expected fix: Publish data-field/status projection for learner UI and reports; no physical migration needed.

## G2-11-017-029 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/more/page.tsx
- Legacy: 11 fixed destination links including settings/team even if elsewhere (more.js:19-46).
- Expected fix: Restore all 11 destinations and safe permission handling.

## G2-11-026-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Public API base /api/v1/public/bug-tracker (PublicBugTrackerController.java:15-18).
- Expected fix: Document intentionally secured route; expose safe reporter intake if approved, without public manager writes.

## G2-11-029-034 [P1] GAP facet F17
- Files: (none, new feature)
- Legacy: useUnsavedFormGuard catches tab/back keyboard nav and beforeunload (useUnsavedFormGuard.js:17-55).
- Expected fix: Implement accessible non-destructive confirmation on navigation.

## G2-14-029-027 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: Separate 'Batch details may be stale', roster error, profiles incomplete warnings with retries (batches/[batchId].js:386-414).
- Expected fix: Render partial/stale banners with retry controls.

## G2-6-016-027 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Search v1 failure 500 exact message Failed to search skills. Please try again or contact support. (SkillController.java:70-75).
- Expected fix: Add friendly localized UI error while honoring genuine 503; do not enable until migration registered.

## G2-6-030-067 [P1] GAP facet F21
- Files: (none, new feature)
- Legacy: Legacy room service checks classScheduleRepository.countByLectureHallId across all schedules before physical delete (LectureHallServiceImpl.java:143-152).
- Expected fix: Audit class schedule/integration dependency and historical delete/restore semantics.

## G2-6-011-024 [P1] MISSING facet F10
- Files: src/modules/placements/tpo-job-type-write-service.ts
- Legacy: Old save receives whole list transaction, updates renames and countsAsPlaced on existing drives `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:121-177`
- Expected fix: On rename and placed-answer change transactionally update affected existing drives

## G2-6-011-042 [P1] MISSING facet F20
- Files: src/modules/placements/tpo-job-type-write-service.ts
- Legacy: Old name rename cascades drive rows transactionally `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:160-169`
- Expected fix: Add transactional linked job rename and race-safe concurrent write guard

## G2-6-022-057 [P1] GAP facet F18
- Files: (none, new feature)
- Legacy: Legacy How sharing works 5 exact bullets on columns/verified marks/phone/never-shown/90-day retention (settings.js:480-487).
- Expected fix: Restore literal privacy promises and verify backend enforces them before display.

## G2-13-023-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:349-357 query shows learner booked slots only and filters to open application stages, published jobs.
- Expected fix: Restrict confirmed booking list to active applications and published rounds; put planned rounds in distinct section.

## G2-14-030-036 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: LBE/controller/InterviewController.java:80-117 safeguards org and college scope for interview access.
- Expected fix: Preserve authorized global SA and pinned-college mutation scopes, avoid other colleges.

## G2-17-031-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/mentor/projects/[projectId].js:7-15 derives key from projectId+account, not `?tab`, preserving open modal state.
- Expected fix: Protect in-progress modal/form state across same-project tab navigation.

## G2-19-027-062 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/service/impl/CourseServiceImpl.java:168-186 blocks deletion when any lesson content or active lessons remain.
- Expected fix: Check descendant lessons and content independently, including nonactive offerings; avoid stranded child data.

## G2-7-002-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:159-206: `?action=`, `?range=`, `?entityId=`, zero-based `?page=` restored and shallow-updated; `status` accepted as former action alias.
- Expected fix: Map existing range and entityId deep links to from/subjectId; bridge page indexes to cursor or page-preserving state.

## G2-7-004-019 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:457-469: Active overrides table paged at 25 including all status values.
- Expected fix: Include archived projects in Active overrides; paginate all matching results at 25.

## G2-7-006-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/index.js:44-64: search stored in shareable `?search=` with shallow URL replace.
- Expected fix: Support legacy `search` URL alias and canonical rewrite to q.

## G2-7-009-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:18-26: client router.replace to `.../:workspaceId/summary` preserving ALL non-id query keys.
- Expected fix: Forward validated query string, especially openTemplate/from/reason, into summary redirect; test deep links.

## G2-7-011-028 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:72-81: form reset/refill after loaded workspace; clears touched state.
- Expected fix: Reinitialize fields when workspace version changes after refresh; avoid stale-edit saves.

## G2-7-013-030 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: max500 rows exact error, missing title `Item N: Title required`
- Expected fix: Expose equivalent row limit/errors with new per-row semantics

## Lane-2 verification evidence (partial)
- OK G2-6-011-024, G2-6-011-042: `saveTpoJobTypes` retains original label mappings and updates linked placement jobs in one transaction; `setTpoJobTypeCountsAsPlaced` updates linked drives under college-row locking.
- OK G2-11-017-029: `TPO_MORE_GROUPS` exposes eleven destinations, including team and settings; each rendered as a same-tab Next.js Link by `TpoMoreNavigation`.
- Remaining rows: not verified; packet intentionally remains unticked pending source-by-source review.
