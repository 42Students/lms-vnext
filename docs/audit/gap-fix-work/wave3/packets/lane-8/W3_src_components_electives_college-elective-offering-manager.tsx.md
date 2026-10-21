# Work packet (wave 3): edit src/components/electives/college-elective-offering-manager.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-014  [P1] MISSING  facet F04  effort L
- Legacy: Old slot drawer shows offering Faculty with PRIMARY/co-teacher and Not assigned state `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:149-168`
- vNext now: New Manage offerings shows course/capacity/enrolled/waitlist but no visible assigned faculty `src/components/electives/college-elective-offering-manager.tsx:114-134`
- Fix: Add faculty assigned list and Set faculty workflow to offering panel

## G2-10-006-047  [P1] MISSING  facet F10  effort L
- Legacy: Old Faculty PUT /offerings/id/faculty and allocate POST /offerings/id/allocate `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:19-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:153-175`
- vNext now: New Manage offerings only creates/edits/archives and links roster; no faculty action in this component `src/components/electives/college-elective-offering-manager.tsx:57-101` `src/components/electives/college-elective-offering-manager.tsx:119-135`
- Fix: Expose scoped assign-faculty and manual allocation capability in vNext equivalent
