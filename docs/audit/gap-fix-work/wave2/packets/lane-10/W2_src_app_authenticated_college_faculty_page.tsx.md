# Work packet (wave 2): edit src/app/(authenticated)/college/faculty/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-6-001-001  [P2] GAP  facet F01  effort S
- Legacy: College entry is `college-admin/teachers`, wrapper selects `teachers` menu `docs/legacy-source/frontend/src/pages/college-admin/teachers.js:9-16`
- vNext now: New college view is `/college/faculty`, no equivalent old URL redirect visible `src/app/(authenticated)/college/faculty/page.tsx:1-9`
- Fix: Add legacy teachers route alias/redirect and verify old navigation bookmarks

## G2-6-001-002  [P2] GAP  facet F01  effort M
- Legacy: Old `AdminGroupShell groupKey=people` provides grouped people navigation `docs/legacy-source/frontend/src/pages/college-admin/teachers.js:31-36`
- vNext now: New route directly embeds role directory without the legacy group shell `src/app/(authenticated)/college/faculty/page.tsx:1-9`
- Fix: Reproduce the people-group tabs/menu affordance for Faculty entry

## G2-15-027-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:49-53 API scope /api/v1/faculty; individual endpoints
- vNext now: src/app/(authenticated)/college/faculty/page.tsx:1-8 role directory and src/app/(authenticated)/admin/faculty/page.tsx:20-44 admin faculty page
- Fix: Map each legacy endpoint to People/Academics/Auth routes and preserve legacy navigation entry points.
