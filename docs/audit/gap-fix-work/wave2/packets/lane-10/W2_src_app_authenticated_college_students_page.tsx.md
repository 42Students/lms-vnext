# Work packet (wave 2): edit src/app/(authenticated)/college/students/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/college-admin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-13-007-001  [P2] GAP  facet F01  effort S
- Legacy: College Admin route /college-admin/students, Redux active menu students (`docs/legacy-source/frontend/src/pages/college-admin/students.js:9-16`)
- vNext now: New uses /college/students and PageHeader, no Redux menu state (`src/app/(authenticated)/college/students/page.tsx:3-9`)
- Fix: Keep old route alias and sidebar item active for Students.

## G2-5-027-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy supports college/global roster reads, learner detail/program/class roster, and mixed paged/unpaged contracts. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-655`
- vNext now: vNext college/admin pages use scoped directory services and membership UUIDs. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Publish every read endpoint equivalent and payload-level compatibility matrix.

## G2-5-027-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy roster backend feeds single learner table with search/filter/paging. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-588`
- vNext now: vNext separated college role directory and superadmin roster with registration panels. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/app/(authenticated)/admin/students/page.tsx:61-92`
- Fix: Compare header/table/filter and edit entry point order across two roles.

## G2-5-027-058  [P2] GAP  facet F13  effort M
- Legacy: Legacy unscoped college admin fails 403 Cannot determine college scope. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:469-533`
- vNext now: vNext directory error/redirect may not use exact legacy message. `src/app/(authenticated)/college/students/page.tsx:1-10`, `src/modules/people/college-role-directory-service.ts:39-47`
- Fix: Render scope-selection state and reset stale filters.
