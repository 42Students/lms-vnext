# Verification packet (P0, do FIRST): 7 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-003-050 [P0] GAP facet F10
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: Bulk active+enabled updates courses and linked lesson visibility `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-448`
- Expected fix: Fix course visibility bulk semantics so students cannot see hidden course

## G2-12-003-051 [P0] GAP facet F10
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: Show/Hide to students toggles course active and enabled `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:600-602`
- Expected fix: Match audience visibility action or rename to accurately warn scope

## G2-12-003-083 [P0] GAP facet F21
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: Course visibility affects learner content queries `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`
- Expected fix: Align downstream learner effective visibility check

## G2-17-008-037 [P0] MISSING facet F10
- Files: src/app/api/courses/lesson-contents/[contentId]/materials/route.ts
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-91 — GET signed file grant /api/v1/resource-files/{id}/materials/{index}/url.
- Expected fix: Add authorised per-material signed grant and wire Open.

## G2-17-008-054 [P0] GAP facet F14
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-89 — File Open requests signed redirect, raw key never shown.
- Expected fix: Issue signed URL without exposing storage key to client.

## G2-17-008-072 [P0] MISSING facet F21
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:31-35 — R2 private-bucket presigned URL integration.
- Expected fix: Wire secure object-storage signing and prohibit public URLs.

## G2-8-025-059 [P0] GAP facet F23
- Files: src/app/api/courses/lesson-contents/[contentId]/materials/route.ts
- Legacy: Legacy single indexed signed FILE URL for staff+learner subject to permissions (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-128).
- Expected fix: Build complete per-material signed grant path for all authorized roles before claiming FILE parity.
