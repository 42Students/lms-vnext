# Work packet: edit src/app/api/people/onboard/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-040  [P1] GAP  facet F10  effort L
- Legacy: Old POST `/api/v1/faculty/register` persists faculty `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-215` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- vNext now: New POST `/api/people/onboard` writes user+membership `src/components/admin/person-onboard-dialog.tsx:75-86` `src/app/api/people/onboard/route.ts:9-35`
- Fix: Map department, faculty enum and old profile metadata into new transactional onboarding
