# Work packet: edit src/app/(authenticated)/college/semesters/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-semesters.md, docs/audit/gap2/lane-6/semester-search-controller.md

## G2-9-019-003  [P1] GAP  facet F01  effort S
- Legacy: No assigned college shows warning with exact instruction `docs/legacy-source/frontend/src/pages/college-admin/semesters.js:18-29`
- vNext now: Missing membership redirects /dashboard `src/app/(authenticated)/college/semesters/page.tsx:20-21`
- Fix: Display actionable warning, not redirect.

## G2-9-019-048  [P1] GAP  facet F11  effort S
- Legacy: Unassigned college warning `docs/legacy-source/frontend/src/pages/college-admin/semesters.js:18-29`
- vNext now: Redirects dashboard `src/app/(authenticated)/college/semesters/page.tsx:20-21`
- Fix: Show explicit legacy access scope warning.

## G2-6-013-013  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:61-63`
- vNext now: `src/app/(authenticated)/college/semesters/page.tsx:20-30`
- Fix: Map exact old error `programId is required (or use GLOBAL superadmin mode)`

## G2-6-013-014  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/semesters/SemesterSearchController.java:78-78`
- vNext now: `src/app/(authenticated)/college/semesters/page.tsx:25-30`
- Fix: Old success says Semesters retrieved; new UI ErrorState copy differs
