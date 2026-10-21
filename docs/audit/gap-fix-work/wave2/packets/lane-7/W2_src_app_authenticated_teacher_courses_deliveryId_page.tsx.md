# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-020  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:13 calls router.replace without API or DB write; docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-121 loads course and faculty assignments downstream.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:11 redirects without DB call; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-41 loads scoped workspace and signals via server services.
- Fix: Document the redirect/bootstrap boundary and verify that destination opens only after current teaching assignment is verified.

## G2-17-001-024  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:208-224 displays explicit signed-out/role-specific access panel.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:10 only UUID validation before redirect; src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:8-12 generic failure panel.
- Fix: Render role/assignment-specific 403 panel at final destination; avoid masking the reason as a generic retryable error.

## G2-17-001-003  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:13 uses client router.replace after router.isReady; history entry replaced.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:11 uses server redirect (Next server 307) to /home.
- Fix: Decide canonical permanent/temporary redirect status and test history/reload equivalence; prefer replace semantics where needed.
