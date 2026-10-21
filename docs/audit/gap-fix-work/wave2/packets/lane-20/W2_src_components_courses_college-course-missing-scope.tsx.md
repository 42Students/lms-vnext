# Work packet (wave 2): edit src/components/courses/college-course-missing-scope.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-courses.md

## G2-3-008-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/courses.js:18-29`
- vNext now: `src/components/courses/college-course-missing-scope.tsx:1-9`
- Fix: Old no-college warning includes `You must be assigned to a college to view and manage courses. Contact your administrator.`; new `Ask a Super Admin to assign a college before opening college.`

## G2-3-008-050  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:98-102`
- vNext now: `src/components/courses/college-course-missing-scope.tsx:3-9`
- Fix: Legacy refuses unscoped college even if user exists with no collegeId, new missing membership error wording/tone different.
