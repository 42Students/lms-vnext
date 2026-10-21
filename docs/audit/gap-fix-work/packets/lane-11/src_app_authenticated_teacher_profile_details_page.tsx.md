# Work packet: edit src/app/(authenticated)/teacher/profile/details/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-002  [P1] GAP  facet F01  effort L
- Legacy: `ProfileSectionsPanel.js:481-493`, `Faculty.js:1-7` admin opens profile section editor from faculty roster using faculty ID.
- vNext now: `src/app/api/people/[membershipId]/faculty-profile/route.ts:18-70` offers admin academic profile GET/PUT; `details/page.tsx:13` only permits own FACULTY membership for full sections.
- Fix: Provide college-admin authorized full faculty profile read/edit for supported sections or document explicit product restriction with owner approval.

## G2-1-003-048  [P1] GAP  facet F11  effort L
- Legacy: `FacultyProfileController.java:55-89` admin can access same-college faculty; non-admin faculty self-only; learner denied; superadmin allowed.
- vNext now: `teacher/profile/details/page.tsx:11-15` requires active FACULTY membership for own self doc; admin academic route `people/[membershipId]/faculty-profile/route.ts:18-69` has separate scoped permissions.
- Fix: Provide full authorized staff profile access for admin/superadmin respecting college scope and no learner access.

## G2-20-030-001  [P1] GAP  facet F01  effort L
- Legacy: Teacher /teacher/profile renders full profile in place and selects profile nav item (`docs/legacy-source/frontend/src/pages/teacher/profile.js:14-37`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:145-162`)
- vNext now: Teacher /teacher/profile only basic summary; full edits under /teacher/profile/details (`src/app/(authenticated)/teacher/profile/page.tsx:8-50`, `src/app/(authenticated)/teacher/profile/details/page.tsx:11-25`)
- Fix: Restore complete on-page profile or render full edit/details content in canonical profile route

## G2-20-030-055  [P1] GAP  facet F11  effort M
- Legacy: Legacy teacher-only role excludes mentor; wrong roles redirect without rendering profile (`docs/legacy-source/frontend/src/pages/teacher/profile.js:20-25`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:39-55`, `docs/legacy-source/frontend/src/pages/teacher/profile.js:113-115`)
- vNext now: vNext page relies on getOwnFacultyProfile and details membership roles includes FACULTY (`src/app/(authenticated)/teacher/profile/page.tsx:8-10`, `src/app/(authenticated)/teacher/profile/details/page.tsx:11-15`)
- Fix: Explicitly ensure role eligibility and redirect parity for ADMIN/MENTOR/LEARNER

## G2-20-030-063  [P1] GAP  facet F13  effort M
- Legacy: Legacy independent section reads allSettled, show missing section names and Retry sections (`docs/legacy-source/frontend/src/components/profile/about.js:177-262`, `docs/legacy-source/frontend/src/components/profile/about.js:905-914`)
- vNext now: New single document request; any error blocks entire details page (`src/app/(authenticated)/teacher/profile/details/page.tsx:13-25`, `src/modules/people/faculty-profile-self.staged.ts:69-96`)
- Fix: Surface granular partial failures and section retry where backend supports it

## G2-4-020-033  [P1] GAP  facet F09  effort L
- Legacy: Legacy profile entity itself defines no drawer/popconfirm controls. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:19-24`)
- vNext now: New About & details editor loads only when DB04 profile storage columns are ready. (`src/app/(authenticated)/teacher/profile/details/page.tsx:13-24`; `src/modules/people/faculty-profile-readiness.ts:5-15`)
- Fix: Register tested profile storage migration so existing profile editing works.

## G2-4-020-046  [P1] GAP  facet F13  effort M
- Legacy: New editor unavailable on unregistered DB04 schema. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:150-198`)
- vNext now: New explicitly renders Profile editing unavailable with no save attempt. (`src/app/(authenticated)/teacher/profile/details/page.tsx:21-24`)
- Fix: Promote verified migration and show successful editing rather than permanent warning.

## G2-4-020-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy teacher profile fetch keeps latest owner and refresh state. (`docs/legacy-source/frontend/src/pages/teacher/profile.js:56-94`)
- vNext now: New server-rendered profile and separate editor route, reload behavior differs. (`src/app/(authenticated)/teacher/profile/page.tsx:8-21`; `src/app/(authenticated)/teacher/profile/details/page.tsx:11-24`)
- Fix: Preserve refresh success and stale-data recovery UX.
