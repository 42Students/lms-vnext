# Work packet: edit src/components/courses/admin-course-overview.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md, docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md, docs/audit/gap2/lane-6/course-home-edit-drawer.md

## G2-19-027-008  [P1] GAP  facet F03  effort M
- Legacy: Legacy `Visible to students` Switch + status tags; Courses.js:90-93,463-511
- vNext now: vNext `Students see it` StatusBadge derived course.status ACTIVE/ARCHIVED; admin-course-overview.tsx:123-142
- Fix: Introduce independent visibility toggle with status/enable mapping; do not conflate temporary hidden with archive or delete.

## G2-19-027-038  [P1] GAP  facet F12  effort L
- Legacy: Legacy `active`, `enabled`, allowedForDisplay independently control visibility; CourseDTO.java:27-31; Courses.js:89-95
- vNext now: vNext ACTIVE/ARCHIVED course status used to derive Student visibility badge; admin-course-overview.tsx:125-142; course-service.ts:126-194
- Fix: Map hide/show separately from archival and per-course display access, preserving existing semester content.

## G2-19-027-050  [P1] GAP  facet F19  effort L
- Legacy: Old `/fetchAll` and `/fetchByCollege` intentionally unpaged for compatibility; paginated variants cap100; CourseController.java:104-156,159-180
- vNext now: vNext listCourses returns all scoped rows (server) then catalogue filters/pages/CSV; course-service.ts:126-200; admin-course-overview.tsx:483-557
- Fix: Push filter/pagination into indexed SQL for large 20-college scale; avoid materializing all rows for every admin request.

## G2-19-027-055  [P1] GAP  facet F22  effort L
- Legacy: Legacy course table has numeric ID, globally unique slug, version, parentCourseId, createdByOrgId, active/enabled/allowedForDisplay, contents JSON and isDeleted; Course.java:16-54 plus BaseModel
- vNext now: vNext normalized courses UUID, departmentId, name/code, status, metadata fields and separate offerings/deliveries; course-service.ts:126-200,204-284; admin-course-overview.tsx:555-604
- Fix: Publish migration crosswalk for slug alias, soft delete/archive, parent, visibility, metadata/education and version before parity signoff.

## G2-12-003-004  [P1] GAP  facet F01  effort S
- Legacy: Legacy editor and existing courses reachable immediately `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:536-634`
- vNext now: Create Course and offering Disclosure closed unless duplicate query `src/components/courses/admin-course-overview.tsx:458-475`
- Fix: Open Create New Course by default

## G2-12-003-008  [P1] GAP  facet F03  effort S
- Legacy: Table cover Image, Course Name, Short Title, Department, Students see it, Dependencies, Actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:468-490`
- vNext now: Merged Course/name/code/details, Department, Dependencies, Students see it, Actions; no image and short title columns `src/components/courses/admin-course-overview.tsx:87-162`
- Fix: Restore cover and Short Title standalone columns

## G2-18-003-031  [P1] GAP  facet F05  effort M
- Legacy: Legacy delete disabled if dependencies lessonCount >0; otherwise server checks. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- vNext now: vNext Archive Course disabled if active offerings >0, independent lesson count. `src/components/courses/admin-course-actions.tsx:254-260`, `src/components/courses/admin-course-overview.tsx:130-145`
- Fix: Show both linked lessons and active offerings blockers, with status-specific reason.

## G2-3-008-004  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:476-478`
- vNext now: `src/components/courses/admin-course-overview.tsx:87-105`
- Fix: Legacy Course Name in college list links to `/college-admin/courses/{slugOrId}`, vNext course-name cell is plain text and requires other navigation. Restore name link to detail page.

## G2-3-008-019  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- vNext now: `src/components/courses/admin-course-overview.tsx:127-139`
- Fix: Legacy visible flag uses active AND enabled and warns hidden cascades to lessons/quizzes/content; vNext single ACTIVE/ARCHIVED enum, may differ from legacy hide-without-delete.

## G2-3-008-041  [P1] MISSING  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:576-593`
- vNext now: `src/components/courses/admin-course-overview.tsx:525-528`
- Fix: Legacy partial bulk success warning `X of Y updated. Retry will target only failed courses.` and Retry failed; no college bulk UI in new.

## G2-3-008-045  [P1] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:456-465`
- vNext now: `src/components/courses/admin-course-overview.tsx:525-528`
- Fix: Old bulk confirmation names up to first five selected courses and scope, new college has no bulk confirmation.

## G2-6-009-025  [P1] GAP  facet F11  effort S
- Legacy: Old component has no role checks; trigger is inside commented `isTeacherRole` condition `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:20-21` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:296-306`
- vNext now: New allowMetadata depends on superadmin path, per-row edit control `src/components/courses/admin-course-overview.tsx:150-165` `src/components/courses/admin-course-actions.tsx:67-82`
- Fix: Confirm route-level edit permission guard allows only privileged course managers, not arbitrary teachers
