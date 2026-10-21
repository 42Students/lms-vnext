# Work packet: edit src/app/(authenticated)/college/quizzes/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-3-001-003  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/quizzes.js:7-17`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:20-23`
- Fix: Show legacy college-unassigned warning and contact-administrator guidance, not only generic scope component.

## G2-3-001-038  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:582-593`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:29-37`
- Fix: Add recoverable server list-load failure with `Quizzes could not be loaded` + Retry; current Next server throw surfaces route error rather than last-data refresh.

## G2-3-001-046  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:62-64`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-259`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:87-107`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:38-44`; `src/modules/courses/college-assessment-aggregate-service.ts:128-176`
- Fix: Verify college-wide read parity across authoring roles and status, using direct scoped aggregate rather than legacy admin API.

## G2-3-001-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/quizzes.js:9-15`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:20-23`
- Fix: Use exact warning heading and description `Admin not assigned to a college` plus contact administrator.
