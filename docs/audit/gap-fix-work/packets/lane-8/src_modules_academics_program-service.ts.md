# Work packet: edit src/modules/academics/program-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-13/new-program.md, docs/audit/gap2/lane-2/l18-u026-new-program-controller.md

## G2-10-020-102  [P1] GAP  facet F21  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — Delete service rejects dependencies; admin decides via Popconfirm.
- vNext now: src/components/academics/academics-actions.tsx:292-311; src/modules/academics/program-service.ts:368-410 — Archive does soft status transition.
- Fix: Review dependent migration FK and restore for safe archive parity.

## G2-10-020-105  [P1] GAP  facet F22  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195 — Physical delete semantics via old controller.
- vNext now: src/modules/academics/program-service.ts:400-410 — New schema uses status ARCHIVED, no row removal.
- Fix: Keep historical data with explicit UX decision and recovery flow.

## G2-13-018-003  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:86-115` /fetchAll supports unscoped superadmin listing across orgs
- vNext now: `src/modules/academics/program-service.ts:138-205` listPrograms requires collegeId and academics.read
- Fix: Provide approved global superadmin all-college discovery or explicitly retire with actor and UI mapping

## G2-13-018-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgram.java:21-22` 4-year integer duration
- vNext now: `src/modules/academics/program-service.ts:38-63` years converted to two terms, and years returned as durationTerms/2
- Fix: Preserve canonical two semesters/year and handle legacy programs with nonstandard term counts without fractional years

## G2-13-018-014  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:34-38` organization-wide list available
- vNext now: `src/modules/academics/program-service.ts:138-205` college-scoped only
- Fix: Support cross-college org program list for organization-wide superadmin scope where still needed

## G2-13-018-031  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:89-115` allows global superadmin/organization-superadmin list if scoped
- vNext now: `src/modules/academics/program-service.ts:146-153` scoped collegeId required, no global invocation
- Fix: Provide all-college read scope for authorized admin without weakening college mutations

## G2-13-018-055  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/NewProgramRepository.java:15-50` queries findByDept/College/Org and findByIdAndNotDeleted
- vNext now: `src/modules/academics/program-service.ts:138-205` college read with optional department only and ACTIVE status
- Fix: Preserve organization/superadmin cross-college reports while restricting normal college roles

## G2-18-026-052  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:113-139 duration shrink checks outside row lock
- vNext now: src/modules/academics/program-service.ts:277-365 no program optimistic version or shrink guard
- Fix: Use guarded update/CAS and affected-record transaction to prevent concurrent dangerous shortening

## G2-18-026-059  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-178 hard-delete guard checks four dependent types
- vNext now: src/modules/academics/program-service.ts:368-420 archival-only and just cohort precheck
- Fix: Owner-approve preservation strategy; prevent archiving records with live enrollments or active structure
