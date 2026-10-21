# Work packet: edit src/app/(authenticated)/admin/semesters/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l18-u029-semester-management.md, docs/audit/gap2/lane-6/semester-search-controller.md

## G2-18-029-059  [P1] GAP  facet F22  effort M
- Legacy: Legacy integer term ID, program_id, number, active and mapped credits from course array. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:326-394`
- vNext now: vNext UUID programTerm records and aggregated mappedCredits. `src/app/(authenticated)/admin/semesters/page.tsx:135-143`
- Fix: Map numeric IDs and active terms.

## G2-18-029-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy programs-load vs semesters-load errors separate. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:518-528`
- vNext now: vNext directory unavailable as single ErrorState. `src/app/(authenticated)/admin/semesters/page.tsx:63-73`
- Fix: Distinguish program vs semester failure.

## G2-6-013-015  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:89-99`
- vNext now: `src/app/(authenticated)/admin/semesters/page.tsx:66-72`
- Fix: Old stats/refresh response strings `Stats retrieved`/`Cache refreshed` not exposed
