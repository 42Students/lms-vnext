# Work packet: edit src/modules/courses/college-assessment-aggregate-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-3/superadmin-quizzes.md

## G2-3-001-020  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-243`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:89-103`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:166-177`
- Fix: Verify legacy repository order and implement equivalent; vNext explicitly sorts due DESC then title ASC/id ASC.

## G2-3-001-046  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:62-64`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:237-259`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:87-107`
- vNext now: `src/app/(authenticated)/college/quizzes/page.tsx:38-44`; `src/modules/courses/college-assessment-aggregate-service.ts:128-176`
- Fix: Verify college-wide read parity across authoring roles and status, using direct scoped aggregate rather than legacy admin API.

## G2-3-001-052  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:62-100`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:53-73`
- Fix: Preserve scoped superadmin access through the equivalent read route without conflating ordinary College Admin scope.

## G2-3-001-054  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:447-464`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:267-285`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:128-178`
- Fix: Compare legacy publish, due, grade-release transitions to vNext `PUBLISH/CLOSE/ARCHIVE`, including non-past-deadline release gate.

## G2-3-005-038  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:128-155`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:53-73`
- Fix: Old collegeId change wipes all filters/dialogs and invalidates request sequence; ensure new SSR adminScope and client dialogs reset.

## G2-3-004-028  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:33-46`; `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:121-170`
- vNext now: `src/app/(authenticated)/admin/quizzes/page.tsx:25-35`; `src/modules/courses/college-assessment-aggregate-service.ts:53-73`
- Fix: Legacy scope selection persists and is applied via scope-token context, vNext depends server adminScope. Verify selected college survives navigation/reload and cannot leak across tenants.

## G2-3-004-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/quizzes.js:25-27`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:85-87`
- vNext now: `src/modules/courses/college-assessment-aggregate-service.ts:53-73`
- Fix: Legacy numeric collegeId and scoped admin principal vs vNext UUID adminScope; ensure immutable mapped tenant/college and authorization checks.
