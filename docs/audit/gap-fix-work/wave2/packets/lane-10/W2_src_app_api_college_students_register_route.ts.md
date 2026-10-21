# Work packet (wave 2): edit src/app/api/college/students/register/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md

## G2-19-001-085  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses Spring endpoints, audit service, notifications and SMS at registration/attendance layers `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-383`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:124-133`
- vNext now: vNext uses Next route -> registerCollegeStudent -> runtime onboarding & enrollment `src/app/api/college/students/register/route.ts:8-15`; `src/modules/people/college-student-registration-service.ts:38-93`
- Fix: Inventory dispatcher/email hooks and audit entries end-to-end, map to runtime replacements.
