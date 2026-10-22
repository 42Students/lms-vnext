# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-020-044 [P1] GAP facet F21
- Files: src/modules/courses/discussion-service.ts
- Legacy: Legacy controller delegates to LessonContentsService and LessonService for scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:24-69`
- Expected fix: Add registered lesson-parent ownership integration, not merely delivery checks.

## G2-5-024-034 [P1] GAP facet F10
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy bulk map update transactional for all keys, returns full scope map. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:637-763`
- Expected fix: Explain partial commit and offer all-or-nothing alternative if required.

## G2-5-024-039 [P1] GAP facet F11
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy organization-scoped superadmin can manage org settings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:696-706`
- Expected fix: Introduce explicit org-scope key reader/writer or owner-approved deprecation.

## G2-5-024-064 [P1] GAP facet F22
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy app_setting accepts multiple named scopes including ORG/DEPARTMENT/PROGRAM/BATCH. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-24`
- Expected fix: Inventory actual readers and migrate supported scopes intentionally.

## G2-5-030-032 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx
- Legacy: Legacy Sign-in child mutation changes loginMethods and reports dirty/busy. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:137-143`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88`
- Expected fix: Reconcile effective login policy and prevent false applied status.

## G2-6-009-025 [P1] GAP facet F11
- Files: src/components/courses/admin-course-overview.tsx, src/components/courses/admin-course-actions.tsx
- Legacy: Old component has no role checks; trigger is inside commented `isTeacherRole` condition `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:296-306`
- Expected fix: Confirm route-level edit permission guard allows only privileged course managers, not arbitrary teachers

## G2-6-020-028 [P1] MISSING facet F07
- Files: (none, new feature)
- Legacy: Legacy DTO invalid chair not found / wrong-college error messages (DepartmentServiceImpl.java:106-114).
- Expected fix: If chair fields restored, use exact field-level errors.

## G2-6-027-061 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy application history supports rich statuses on entity and timeline (JobController.java:547-563).
- Expected fix: Build derived unified screening/round/offer timeline rather than assuming base history substitutes all stages.

## G2-11-017-042 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: Reads backend pending student request and recruiter unread count integrations (TpoWorkspaceController.java:267-274).
- Expected fix: Trace source services and add batched scoped lightweight counts query.

## G2-11-026-005 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Issue fields reporterName/accountRole/environment/page/screen/section/issueType/description/severity/evidenceLink/sourceUrl/sourcePath/browser/viewport (BugReportCreateRequest.java:9-40).
- Expected fix: Accept validated legacy metadata (2000/500/500/64 max) and persist it.

## G2-12-011-004 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Feed uses up to 40 audit,40 changes, unread messages then top40 sorted (RecruiterNotificationService.java:75-137).
- Expected fix: Union recruiter message threads and change-request events into same feed.

## G2-15-024-006 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: @PreAuthorize hasRole('SUPER_ADMIN') plus explicit requireSuperAdmin (SuperAdminE2eController.java:38-46).
- Expected fix: Require both strict environment opt-in and Super Admin authorization on any seed writer.

## G2-6-016-031 [P1] MISSING facet F08
- Files: (none, new feature)
- Legacy: Legacy selects return Selection recorded, batch Selections recorded (SkillController.java:96-132).
- Expected fix: Implement permissioned POST selection tracking and exact success/error UX.

## G2-6-005-009 [P1] GAP facet F04
- Files: src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx
- Legacy: Old destination roster has Email and Contact fields `docs/legacy-source/frontend/src/pages/teacher/contacts/[contactsTab].js:15-23`
- Expected fix: Resolve destination's intentional contact-data privacy exception (U004), not redirect index

## G2-12-027-001 [P1] MISSING facet F01
- Files: (none, new feature)
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:29-32,73-86: `/api/v1/teaching-assignment/get/{id}` returns one assignment by numeric ID.
- Expected fix: Implement owner-scoped assignment detail GET or provide verified equivalent link/projection with legacy metadata.

## G2-13-023-014 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:317-338 uses reason and preferredTimes as text, no strict dates/time or venue.
- Expected fix: Align UI/server reason cap (900 vs 2000); decide whether preferredTimes text remains supported.

## G2-14-030-037 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:108-122 conflict soft warning, user can save; backend definitive validation.
- Expected fix: Restore soft warning at edit and evaluate cross-company candidate clashes and 15min buffer.

## G2-17-031-010 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:273-307 ProjectWorkspaceDTO with nested overview/sprints/tasks/status; model serialized per workspace.
- Expected fix: Create full legacy nested-section and ID to UUID migration projection.

## G2-19-027-064 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/service/impl/CourseServiceImpl.java:233-267 rejects case-insensitive duplicate course_name OR short_title per department.
- Expected fix: Match legacy duplicate short title or preserve as uniqueness in migrated data.

## G2-7-002-019 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:273-281: actor distinct counts from each fetched record's actorUserId else actorName.
- Expected fix: Calculate distinct actor count over all 40 raw events before grouping, not groups' latest actor.

## G2-7-004-022 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:607-630: release Points column completed/committed count; Target date from API.
- Expected fix: Compute committed and completed points and real target date from schema/legacy source; don't render null constantly.

## G2-7-007-002 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:78-86: `View audit trail` opens `/college-admin/projects/audit?entityId=<slug>&range=all`.
- Expected fix: Generate `/college/projects/audit?subjectId=<uuid>&range=all` (or supported params) for College Admin; test route and role.

## G2-7-009-006 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-13: `openTemplate=1` and `reason=` are expressly retained for Summary.
- Expected fix: Keep openTemplate and reason parsed and encoded in redirect URL.

## G2-7-011-039 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:34-57: native beforeunload and `window.confirm('You have unsaved changes. Leave without saving them?')` on route change.
- Expected fix: Warn on cancel, Close, Back/tab and unload; retain exact copy.

## G2-7-013-037 [P1] GAP facet F09
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:105-107: Undo remove inline hyperlink immediately
- Expected fix: Add reversible removal path and confirm persistence semantics
