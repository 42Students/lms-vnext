# Work packet: edit src/app/(authenticated)/college/electives/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-electives.md, docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-9-007-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/electives.js:20-31` — Missing college warning Admin not assigned to a college and contact administrator text
- vNext now: `src/app/(authenticated)/college/electives/page.tsx:18-19` — Absent membership redirects to dashboard silently
- Fix: Show equivalent explicit unassigned-college diagnostic

## G2-9-007-035  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:216-218` — Slot load error with Retry slots and specific detail
- vNext now: `src/app/(authenticated)/college/electives/page.tsx:25-40` — Invalid filter error is handled, directory fetch error has no in-page retry
- Fix: Add safe data-load error retry banner

## G2-4-024-035  [P2] GAP  facet F07  effort M
- Legacy: Legacy no college choice error `Select a college first` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:68-76`)
- vNext now: New missing membership redirects dashboard (`src/app/(authenticated)/college/electives/page.tsx:21-28`)
- Fix: Use warning on selected acting-college instead of redirect for Super Admin.
