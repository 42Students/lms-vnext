# Work packet (wave 2): edit src/modules/people/college-student-registration-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-19-001-027  [P2] GAP  facet F06  effort S
- Legacy: Legacy registration College disabled read-only with fetched friendly college name `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1186-1188`
- vNext now: vNext omits College input and relies on server selected scope `src/components/college/college-student-register-form.tsx:70-106`; `src/modules/people/college-student-registration-service.ts:30-43`
- Fix: Display non-editable selected college name in register form without accepting it from request body.

## G2-19-001-085  [P2] GAP  facet F21  effort M
- Legacy: Legacy uses Spring endpoints, audit service, notifications and SMS at registration/attendance layers `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-383`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:124-133`
- vNext now: vNext uses Next route -> registerCollegeStudent -> runtime onboarding & enrollment `src/app/api/college/students/register/route.ts:8-15`; `src/modules/people/college-student-registration-service.ts:38-93`
- Fix: Inventory dispatcher/email hooks and audit entries end-to-end, map to runtime replacements.

## G2-5-027-064  [P2] GAP  facet F15  effort M
- Legacy: Legacy create/move logged AdminAuditLog rows. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:380-385,1041-1048`
- vNext now: vNext identity runtime and activity for move; registration audit spans multiple writes. `src/modules/people/college-student-registration-service.ts:38-93`, `src/modules/academics/college-student-section-move-service.ts:166-175`
- Fix: Unify history around membership and enrollment IDs.
