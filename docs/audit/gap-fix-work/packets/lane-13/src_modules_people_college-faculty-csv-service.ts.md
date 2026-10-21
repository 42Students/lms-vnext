# Work packet: edit src/modules/people/college-faculty-csv-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-022  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyItem.java:21-41 bulk first AND last nonblank; dept required; mobile max20; email optional; role LECTURER/MENTOR
- vNext now: src/modules/people/college-faculty-csv-service.ts:44-63 merges names, no dept CSV field and optional faculty type
- Fix: Add department binding/role validation and keep fields required independent.

## G2-15-027-044  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:243-266 bulk each row own REQUIRES_NEW and LECTURER default
- vNext now: src/modules/people/college-faculty-csv-service.ts:73-98 per-row onboard then profile update can PARTIAL
- Fix: Make person+profile atomic per row and use explicit default faculty type.

## G2-15-027-064  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:243-266 each faculty row commits separately
- vNext now: src/modules/people/college-faculty-csv-service.ts:77-96 identity may persist when profile update fails
- Fix: Use per-record transactional onboarding to avoid partial accounts.

## G2-15-027-026  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:293-309 invalid mobile and duplicate mobile exact distinct messages
- vNext now: src/modules/people/college-faculty-csv-service.ts:53-61 MOBILE_INVALID / DUPLICATE_MOBILE_IN_FILE code list
- Fix: Render legacy human-readable error text with row field context.
