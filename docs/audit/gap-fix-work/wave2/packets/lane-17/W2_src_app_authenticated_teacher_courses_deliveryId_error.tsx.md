# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/teacher-courses-courseid-index.md

## G2-17-001-024  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:208-224 displays explicit signed-out/role-specific access panel.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:10 only UUID validation before redirect; src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:8-12 generic failure panel.
- Fix: Render role/assignment-specific 403 panel at final destination; avoid masking the reason as a generic retryable error.

## G2-17-001-028  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:209-224 handles assignment/failed request with explicit error panel; :220-224 Try again triggers retryKey.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:8-12 offers generic error with reset() and Back to Courses.
- Fix: Distinguish permission loss from transport error; mirror actual recovery behavior and copy.

## G2-17-001-036  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:211-224 uses 'Try again' in error CTA; src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:11 uses 'Retry'.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx:11 uses 'Retry'.
- Fix: Choose consistent exact retry label ('Try again') for equivalent states.
