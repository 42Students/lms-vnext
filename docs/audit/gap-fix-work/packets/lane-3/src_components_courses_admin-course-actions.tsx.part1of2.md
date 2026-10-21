# Work packet: edit src/components/courses/admin-course-actions.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md

## G2-19-027-005  [P1] GAP  facet F02  effort L
- Legacy: Legacy course records edit Course Name, Short display name, Official code, introduction and artwork in one course form; Courses.js:41-95
- vNext now: vNext course Edit dialog for name/code/meta; separate Course Home editor for rich overview; admin-course-actions.tsx:139-219; admin-course-display-editor.tsx:1-190
- Fix: Create one legacy-faithful edit entry with linked metadata fields and saving state; preserve normalized backend storage.

## G2-19-027-020  [P1] GAP  facet F06  effort L
- Legacy: Legacy update may change dept within same college after both destination and source access checks; CourseController.java:330-347
- vNext now: vNext `departmentId` immutable after create, omitted update schema and Edit dialog says so; validation.ts:66-88; admin-course-actions.tsx:150-155
- Fix: Clarify desired college-internal department reassignment; if restoring, validate both scopes transactionally and forbid cross-college transfer.

## G2-12-003-044  [P1] GAP  facet F09  effort M
- Legacy: Delete Popconfirm with linked-lesson explanation `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:505-513`
- vNext now: Archive ConfirmDialog with active Offering blocker text `src/components/courses/admin-course-actions.tsx:253-275`
- Fix: Clarify differing dependencies and archive semantics in confirm

## G2-12-003-088  [P1] GAP  facet F23  effort S
- Legacy: Legacy Delete course action `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-405`
- vNext now: VNext Archive action preserves historical row `src/components/courses/admin-course-actions.tsx:253-275`
- Fix: Document intentional deletion-to-archive business change

## G2-18-003-024  [P1] GAP  facet F04  effort M
- Legacy: Legacy In this Course heading, description and ordered bullet takeaways. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-75`
- vNext now: vNext name/code/description/takeaways, without distinct heading field in course table. `src/db/schema/courses.ts:34-61`, `src/components/courses/admin-course-actions.tsx:213-242`
- Fix: Restore persisted introduction heading and rich ordered takeaways for old course overview rendering.

## G2-18-003-031  [P1] GAP  facet F05  effort M
- Legacy: Legacy delete disabled if dependencies lessonCount >0; otherwise server checks. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext Archive Course disabled if active offerings >0, independent lesson count. `src/components/courses/admin-course-actions.tsx:254-260`, `src/components/courses/admin-course-overview.tsx:130-145`
- Fix: Show both linked lessons and active offerings blockers, with status-specific reason.

## G2-18-003-042  [P1] GAP  facet F06  effort L
- Legacy: Legacy Edit Department can change, and all original metadata remains untouched if hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:37-40`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-375`
- vNext now: vNext Edit explicitly department immutable; code/name metadata only. `src/components/courses/admin-course-actions.tsx:143-151`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Choose safe department move flow with impact preview or approved immutability rationale.

## G2-18-003-061  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT updateCourse with field merge and optional replaced image R2 best-effort cleanup. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-382`
- vNext now: vNext PATCH `/api/courses/:id` allowed metadata only, no image. `src/app/api/courses/[courseId]/route.ts:16-40`, `src/components/courses/admin-course-actions.tsx:166-180`
- Fix: Implement update image upload + safe old image lifecycle, account for signed URLs and races.

## G2-3-008-043  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:505-514`
- vNext now: `src/components/courses/admin-course-actions.tsx:124-140`
- Fix: Legacy Delete course Popconfirm with linked lessons precheck and exact warning; new More→Archive confirmation against active offerings, different blocker.

## G2-3-008-053  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:491-516`
- vNext now: `src/components/courses/admin-course-actions.tsx:84-140`
- Fix: Legacy delete blocks when lessons linked, vNext archive blocks when offerings active but hidden courses can still have lessons; match dependency guard rationale.

## G2-3-008-081  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:491-516`
- vNext now: `src/components/courses/admin-course-actions.tsx:124-140`
- Fix: Legacy Delete + Duplicate direct action, new Archive+Duplicate menu and no bulk college visibility; priority workflow mismatch.

## G2-4-008-008  [P1] GAP  facet F03  effort M
- Legacy: Row buttons Edit and danger Delete with icons, ID-specific aria labels. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: Active row has `Manage assignment` Disclosure, nested Edit role and End; no complete Edit/Delete icon. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-44;src/components/admin/super-admin-faculty-assignment-create.tsx:151-170;src/components/courses/admin-course-actions.tsx:548-555`)
- Fix: Expose full Edit modal with legacy icon/action placement, clarify End vs Delete.

## G2-4-008-041  [P1] GAP  facet F10  effort M
- Legacy: Legacy DELETE separate from soft deactivate endpoint. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:14-18;docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190`)
- vNext now: New DELETE ends teaching assignment, retains all history. (`src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Explicitly decide hard deletion vs history-preserving End; expose distinct actions if needed.

## G2-4-008-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy updates `is_active=false` via Edit, can later reactivate; separate deactivate endpoint. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284;docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:176-190`)
- vNext now: New ENDED when teaching/delivery end, End retention, no reactivation UI. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:51-73;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Specify reactivation/end transition parity and add allowed operations.

## G2-4-008-069  [P1] GAP  facet F21  effort M
- Legacy: Legacy Java Admin APIs create, bulk, update, hard delete, deactivate; Java security scope validator. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-190`)
- vNext now: New batched admin creation and generic course teaching assignment role edit/end API. (`src/components/admin/super-admin-faculty-assignment-create.tsx:34-51;src/components/admin/super-admin-faculty-assignment-create.tsx:133-149;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Map all five old mutation classes, ensure acting scope privilege.

## G2-6-009-025  [P1] GAP  facet F11  effort S
- Legacy: Old component has no role checks; trigger is inside commented `isTeacherRole` condition `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:296-306`
- vNext now: New allowMetadata depends on superadmin path, per-row edit control `src/components/courses/admin-course-overview.tsx:150-165` `src/components/courses/admin-course-actions.tsx:67-82`
- Fix: Confirm route-level edit permission guard allows only privileged course managers, not arbitrary teachers

## G2-19-027-027  [P2] GAP  facet F08  effort S
- Legacy: Create/update success Response OK envelope, delete success `Course deleted successfully`, restore `Course restored`; CourseController.java:91-92,377-381,431-436,472-476
- vNext now: vNext POST201 `{course}`, PATCH `{course}`, DELETE `{course}` and toast `Updated course “name”.`, archive UI; route.ts:35-50; [courseId]/route.ts:36-65; admin-course-actions.tsx:35-66,181-203
- Fix: Map old API status/error envelopes for legacy consumers, clone success toast/copy for delete vs archive accurately.

## G2-19-027-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy failed deletion banner `Course was not deleted` plus Retry delete, preserved selected row; Courses.js:570-575
- vNext now: vNext generic error toast title `Course update failed`, no inline retry panel in CourseActions; admin-course-actions.tsx:37-64
- Fix: Restore persistent, dismissible row-specific delete/archival failure and Retry affordance.

## G2-12-003-036  [P2] GAP  facet F07  effort S
- Legacy: Map edit API errors to Form.Item and `Course changes were not saved` alert `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:371-380`
- vNext now: Generic Course update failed toast `src/components/courses/admin-course-actions.tsx:34-62`
- Fix: Restore edit modal field and error alert

## G2-12-003-039  [P2] GAP  facet F08  effort S
- Legacy: Delete success `Deleted course “X”.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:394-394`
- vNext now: Archive success `Course archived` `src/components/courses/admin-course-actions.tsx:253-273`
- Fix: Align destructive action status and wording based on archive policy
