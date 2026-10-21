# Work packet (wave 2): edit src/modules/placements/round-service.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/job-round-repository.md, docs/audit/gap2/lane-8/job-round.md

## G2-15-014-002  [P2] GAP  facet F01  effort M
- Legacy: Lists rounds for a drive via service. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:549-551`)
- vNext now: New listPlacementRounds by job UUID with scope. (`src/modules/placements/round-service.ts:97-116`)
- Fix: Map old drive jobId route to scoped UUID round listing.

## G2-15-014-005  [P2] GAP  facet F02  effort S
- Legacy: Rounds displayed in sequence from repository. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:549-551`)
- vNext now: Returns rounds sequence then createdAt. (`src/modules/placements/round-service.ts:108-115`)
- Fix: Clone legacy order and card section flow on TPO round list.

## G2-15-014-008  [P2] GAP  facet F03  effort M
- Legacy: Delete blocked when students/results exist. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:78-93`)
- vNext now: New removal uses CANCELLED status action. (`src/modules/placements/round-service.ts:487-515`)
- Fix: Preserve disabled delete guidance, explain archive instead of hard remove.

## G2-15-014-014  [P2] GAP  facet F05  effort S
- Legacy: findByJobIdOrderBySeqAsc job-specific ascending order, no second sort. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:17-17`)
- vNext now: New sequence ascending then createdAt ascending. (`src/modules/placements/round-service.ts:108-115`)
- Fix: Preserve stable fallback ordering and enforce unique active sequence.

## G2-15-014-015  [P2] GAP  facet F05  effort M
- Legacy: Deleting round resequences remaining rows 1..N. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:98-100`)
- vNext now: New insertion sequence MAX(active)+1 and archive action leaves gaps. (`src/modules/placements/round-service.ts:172-189`)
- Fix: Document visible numbering gaps after remove and decide compact/resequence.

## G2-15-014-018  [P2] GAP  facet F06  effort M
- Legacy: Old form fields id,seq,kind,name,mode,scheduledDate,venue,meetingUrl,whatToBring,platform,testLink,durationMinutes,resultsDue. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/RoundForm.java:11-25`)
- vNext now: New create uses name/kind/details, scheduling separated to action. (`src/modules/placements/round-service.ts:191-205`)
- Fix: Clone old single-round form grouping/defaults while preserving schedule action integrity.

## G2-15-014-020  [P2] GAP  facet F06  effort M
- Legacy: New round name trimmed, start status PENDING -> SCHEDULED if date set. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:61-73`)
- vNext now: New create only PENDING; schedule through actOnPlacementRound. (`src/modules/placements/round-service.ts:191-205`)
- Fix: Ensure one-form create+schedule keeps same final status.

## G2-15-014-021  [P2] GAP  facet F06  effort M
- Legacy: Old seq chosen max+1 under locked job. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:53-59`)
- vNext now: New same job FOR UPDATE and MAX among noncancelled. (`src/modules/placements/round-service.ts:154-189`)
- Fix: Do not reuse CANCELLED sequence value while historical rounds retain links.

## G2-15-014-031  [P2] GAP  facet F10  effort S
- Legacy: Spring JPA read SELECT ... WHERE job_id ORDER BY seq ASC. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:17-17`)
- vNext now: New Drizzle SELECT WHERE jobId ORDER BY sequence,createdAt. (`src/modules/placements/round-service.ts:108-115`)
- Fix: Make deterministic historical sorting identical to old round order.

## G2-15-014-044  [P2] GAP  facet F12  effort M
- Legacy: Reorder prohibited once results or current application stage set. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:103-121`)
- vNext now: Mutation service disallows nonpending round and uses order-specific guards. (`src/modules/placements/round-service.ts:225-260`)
- Fix: Test cross-round dependencies and ensure no reorder after bookings.

## G2-15-014-054  [P2] GAP  facet F18  effort S
- Legacy: Exact A round needs a type and a name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:35-40`)
- vNext now: New schema error without matching displayed copy. (`src/modules/placements/round-service.ts:147-149`)
- Fix: Surface old validation wording.

## G2-15-014-055  [P2] GAP  facet F18  effort S
- Legacy: Students are already in this round, so its type can't change. Add a new round instead. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:45-48`)
- vNext now: New generic PLACEMENT_ROUND_NOT_EDITABLE. (`src/modules/placements/round-service.ts:238-242`)
- Fix: Map the dependent-kind-change message specifically.

## G2-8-015-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy Hibernate persistence with generated ID (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:23-25`)
- vNext now: VNext Drizzle insert on scoped job (`src/modules/placements/round-service.ts:142-225`)
- Fix: Preserve round creation semantics and ID return mapping
