# Work packet (wave 2): edit src/modules/people/college-faculty-detail-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-19-019-006  [P2] GAP  facet F03  effort M
- Legacy: FacultyTeachingAssignmentResponseDTO.java:13-25 facultyName, courseSlug, courseName, className, batchName, courseImageUrl
- vNext now: src/modules/people/college-faculty-detail-service.ts:57-120 returns role/status and delivery fields, no guaranteed courseImageUrl
- Fix: Show course cover/slug and batch name where old row/detail did, or record owner-approved de-scope

## G2-15-027-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:334-357 department roster returns full Faculty object with identity redacted by role
- vNext now: src/modules/people/college-faculty-detail-service.ts:29-55 summary membership/profile only
- Fix: Provide safe department-scoped roster with legacy visible fields and no identity leak.

## G2-15-027-013  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:571-612 exact 4 unique classes/courses counts
- vNext now: src/modules/people/college-faculty-detail-service.ts:90-116 counts totalAssignments/activeAssignments/distinctOfferings
- Fix: Compute and expose distinct classes/courses by faculty/target course or class separately.

## G2-15-027-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:360-389 omitted page returns full array; paged branch defaults size25 clamp1..200
- vNext now: src/modules/people/college-faculty-detail-service.ts:96-123 faculty detail history hard-capped 100 rows
- Fix: Define bounded roster with 25 default, upper200, totalPages and stable filter semantics.

## G2-15-027-047  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:360-390 page can be negative and size beyond bounds clamped
- vNext now: src/modules/people/college-faculty-detail-service.ts:96-123 list caps at 100 and signals truncated
- Fix: Align page-size limits and stable total for large faculty rosters.

## G2-15-027-061  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:379-389 DB PageRequest defaults 25 max200
- vNext now: src/modules/people/college-faculty-detail-service.ts:90-123 detail assignments capped100
- Fix: Add server-side paginated faculty roster and history with total counts.

## G2-15-027-073  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:571-612 four distinct faculty assignment metrics
- vNext now: src/modules/people/college-faculty-detail-service.ts:90-116 only total/active/distinct offerings
- Fix: Add each missing metric or document explicit chosen retirement.
