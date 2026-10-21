# Work packet: edit src/app/(authenticated)/college/lecture-halls/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-lecture-halls.md

## G2-9-017-003  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/lecture-halls.js:17-28` — Unassigned college renders Admin not assigned to a college explanatory warning.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:39-41` — No membership redirects dashboard.
- Fix: Show contextual no-college warning and administrator guidance.

## G2-9-017-043  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-312` — Independent colleges/departments failure banners with Retry; optional department stays blank.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-84` — Promise.all result & departments; failure may reject full page.
- Fix: Isolate department lookup failure; allow creating without department.

## G2-9-017-065  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:302-310` — Colleges and departments error isolated, create department remains optional.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-84` — listLectureHalls/listDepartments Promise.all, department failure blocks all.
- Fix: Use isolated results and degraded create mode.

## G2-9-017-086  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:71-91` — Fetch halls/departments independently and failures isolated.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-84` — Promise.all list and departments couples failures.
- Fix: Decouple lookup and list reads.

## G2-9-017-044  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:409-412` — Failed list load shows Could not load lecture halls; use Retry above.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:53-66` — Only Invalid lecture hall filters for query validation.
- Fix: Create dedicated network-error state with retry and last rows.

## G2-9-017-048  [P2] MISSING  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:306-310` — Departments could not be loaded, allow optional blank and retry copy.
- vNext now: `src/app/(authenticated)/college/lecture-halls/page.tsx:70-84` — No inline degraded lookup warning.
- Fix: Display helper/banner with departments retry.
