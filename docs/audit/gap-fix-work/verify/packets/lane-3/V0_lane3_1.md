# Verification packet (P0, do FIRST): 5 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-027-052 [P0] GAP facet F20
- Files: src/modules/courses/course-service.ts
- Legacy: Legacy `@Version` on Course prevents lost updates, returns 409 with refresh copy; Course.java:37-47; CourseController.java:384-390
- Expected fix: Require expectedUpdatedAt/version CAS for PATCH, reject stale modal with 409 and keep in-progress form for reapply.

## G2-11-002-098 [P0] MISSING facet F23
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Selection send CTA under Offers `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:509`
- Expected fix: Restore CTA

## G2-2-012-057 [P0] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:160-177 accurate risk by marked sessions
- Expected fix: Do not present misleading eligibility-risk alerts; correct query before adoption.

## G2-12-021-019 [P0] GAP facet F10
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:574-599 saves consumed receipt with student_assignment_id after submission
- Expected fix: Change transaction order to insert submission, atomically consume receipt, insert attested file row; verify composite FK

## G2-12-021-034 [P0] GAP facet F20
- Files: src/modules/courses/assignment-submission-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AssignmentUploadReceiptRepository.java:20-28 atomic claim for Resource receipt guarded by expiry/owner/key
- Expected fix: Reverse mutation order to satisfy staged composite FK and ensure rollback on second consumer
