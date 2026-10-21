# Work packet (wave 2): edit src/modules/placements/recruiter-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/recruiter.md

## G2-15-016-003  [P2] GAP  facet F01  effort M
- Legacy: SearchActive recruiter collection for admin/TPO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:35-45`)
- vNext now: New recruiter-grant list scoped by college, not global active recruiter search. (`src/modules/placements/recruiter-service.ts:74-155`)
- Fix: Provide equivalent scoped recruiter person lookup and search.

## G2-15-016-005  [P2] GAP  facet F02  effort M
- Legacy: SearchActive by name/email/mobile. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:35-45`)
- vNext now: New grant roster sorted by company/name. (`src/modules/placements/recruiter-service.ts:74-155`)
- Fix: Add old search/filter entrypoints on recruiter account manager if consumed.

## G2-15-016-016  [P2] GAP  facet F05  effort M
- Legacy: SearchActive by first/last/mobile/email with % like. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:35-41`)
- vNext now: New active grant list sorted company/name, no free-text query parameter. (`src/modules/placements/recruiter-service.ts:74-155`)
- Fix: Preserve name/email/mobile search and paging.

## G2-15-016-035  [P2] GAP  facet F10  effort S
- Legacy: CreatedByUserId and createdByUserType. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:75-79`)
- vNext now: New creation stores createdByUserId only. (`src/modules/placements/recruiter-service.ts:207-215`)
- Fix: Preserve role provenance as actor metadata at profile creation.

## G2-15-016-037  [P2] GAP  facet F10  effort M
- Legacy: Pageable recruiter search supports any lowercase pattern. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:35-41`)
- vNext now: New company/name-scoped grant list no pageable API. (`src/modules/placements/recruiter-service.ts:74-155`)
- Fix: Add text search with server pagination and stable sort.

## G2-15-016-047  [P2] GAP  facet F13  effort S
- Legacy: Existing email soft-deleted row resolves duplicate. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:24-30`)
- vNext now: Grant rejects unavailable user. (`src/modules/placements/recruiter-service.ts:185-206`)
- Fix: Return actionable account-restore path for deleted recruiter identities.

## G2-15-016-057  [P2] GAP  facet F19  effort M
- Legacy: SearchActive paginated with Pageable index. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/RecruiterRepository.java:35-41`)
- vNext now: New all active grants list sort name, no limit in service. (`src/modules/placements/recruiter-service.ts:74-155`)
- Fix: Server-side pagination for high-volume recruiter directories.
