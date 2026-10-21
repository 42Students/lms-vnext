# Work packet (wave 2): edit src/app/api/colleges/[collegeId]/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md

## G2-3-028-005  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:147-190`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:19-54`
- Fix: Map legacy PUT full CollegeDTO to PATCH partial and document intentionally immutable organization/code.

## G2-3-028-006  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:194-239`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:57-103`
- Fix: Legacy DELETE soft-deletes; vNext DELETE archives and can clear selected scope cookie.

## G2-3-028-021  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:175-179`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:44-51`
- Fix: Legacy update success status OK / message College updated successfully / data vs vNext {college}.

## G2-3-028-022  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/CollegeController.java:220-223`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:72-99`
- Fix: Legacy delete returns College deleted successfully; vNext returns archive-shaped response with altered semantics.

## G2-3-028-078  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:155-190`
- vNext now: `src/app/api/colleges/[collegeId]/route.ts:19-54`
- Fix: Legacy TenantDomainRepository upsert is coupled to college update; vNext dedicated domain service must cover rollback/verification.
