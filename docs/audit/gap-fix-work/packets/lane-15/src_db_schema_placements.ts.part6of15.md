# Work packet: edit src/db/schema/placements.ts (part 6 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-14/u020-college-company.md, docs/audit/gap2/lane-15/job-eligibility-override.md, docs/audit/gap2/lane-15/job-round-repository.md

## G2-14-019-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy no-show feedback admin only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-113`
- vNext now: New round/slot model has no NO_SHOW status `src/db/schema/placement-round-candidate-slots.ts:29-35` `src/db/schema/placements.ts:1301-1304`
- Fix: Add no-show outcome without exposing raw admin feedback

## G2-14-019-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy interview table int PK and 4 FK, interviewType/status, UTC scheduledDate, feedback/reschedule JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-171`
- vNext now: New separate placementJobRounds and placementRoundCandidateSlots UUID FKs/timestamps `src/db/schema/placements.ts:1222-1351` `src/db/schema/placement-round-candidate-slots.ts:7-35`
- Fix: Create full legacy-to-new field migration crosswalk with stable interview ID alias

## G2-14-019-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy reschedule history prev date/changedAt and feedback provenance `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:125-158`
- vNext now: New slot confirmedAt/changedBy, round results and request history `src/db/schema/placement-round-candidate-slots.ts:18-24` `src/db/schema/placements.ts:1354-1493`
- Fix: Preserve history/attribution and private feedback data

## G2-14-020-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy stores relationship plus notes contact owner trust and link metrics in one row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:29-75`
- vNext now: New relation stores status, trusted, owner and share defaults; notes/contact/link metrics not on row `src/db/schema/placements.ts:78-116`
- Fix: Crosswalk all missing per-college fields into bounded private CRM tables

## G2-14-020-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy int collegeId/companyId and Long relation id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:25-33`
- vNext now: New UUID FK college and company plus generated ID `src/db/schema/placements.ts:78-85`
- Fix: Map legacy college/company IDs and relation identity

## G2-14-020-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy contact name varchar150/email150/phone30 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:38-45`
- vNext now: No columns in new relationship row `src/db/schema/placements.ts:78-116`
- Fix: Add privacy-scoped contact fields or archival disposition

## G2-14-020-011  [P1] GAP  facet F04  effort L
- Legacy: Legacy joinTokenHash SHA256 hex max64 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:64-66` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:85-90`
- vNext now: New company relationship has no join token hash `src/db/schema/placements.ts:78-116`
- Fix: Implement hashed token binding and secure rotation or record intentional removal

## G2-14-020-034  [P1] GAP  facet F11  effort M
- Legacy: Legacy organization-level listed-company check grants org-wide job linkage `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/CollegeCompanyRepository.java:25-28`
- vNext now: New relationship is strictly college unique, no simple org-any lookup `src/db/schema/placements.ts:78-85` `src/modules/placements/company-service.ts:107-149`
- Fix: Implement approved org-sharing projection without exposing private notes

## G2-14-020-038  [P1] GAP  facet F12  effort L
- Legacy: Legacy join link hash unique to relationship and email verification `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:64-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:30-34`
- vNext now: New relation no join hash `src/db/schema/placements.ts:78-116`
- Fix: Preserve one-link-per-company-college semantics

## G2-14-020-055  [P1] GAP  facet F20  effort M
- Legacy: Legacy join counters increment non-atomically read then save under transaction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:126-130` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-189`
- vNext now: New no counters `src/db/schema/placements.ts:78-116`
- Fix: Add atomic increments/dedupe under concurrency

## G2-14-020-056  [P1] GAP  facet F20  effort M
- Legacy: Legacy token hash SHA256, never stores raw token `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:64-66` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:85-90`
- vNext now: New lacks join token fields `src/db/schema/placements.ts:78-116`
- Fix: Keep opaque random token and hash-only storage

## G2-14-020-060  [P1] GAP  facet F22  effort L
- Legacy: Legacy contact, notes, trust and hashed invitation metrics all in one row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-75`
- vNext now: New relationship only trust/owner/status/shareColumns timestamps `src/db/schema/placements.ts:87-116`
- Fix: Create disposition for each missing column, avoid cross-college leakage

## G2-14-020-062  [P1] GAP  facet F22  effort M
- Legacy: Legacy company ownerFacultyId int `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:47-48`
- vNext now: New ownerMembershipId UUID `src/db/schema/placements.ts:96-99`
- Fix: Resolve active faculty membership and preserve historical owner

## G2-15-015-009  [P1] GAP  facet F04  effort L
- Legacy: Old bigint id, integer job/learner foreign identities. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:23-32`)
- vNext now: UUID id, jobId and membershipId. (`src/db/schema/placements.ts:924-934`)
- Fix: Map old job/learner identifiers to new UUID membership and job.

## G2-15-015-010  [P1] GAP  facet F04  effort M
- Legacy: overrideType string, reason string, createdBy nullable integer. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:33-41`)
- vNext now: decision string, reason and mandatory createdByUserId UUID. (`src/db/schema/placements.ts:935-941`)
- Fix: Preserve actor attribution, choose safe legacy null actor migration rule.

## G2-15-015-062  [P1] GAP  facet F22  effort L
- Legacy: Numeric IDs, created_by nullable and naive LocalDateTime. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobEligibilityOverride.java:23-45`)
- vNext now: New UUIDs, nonnullable user, revokedAt and aware createdAt. (`src/db/schema/placements.ts:924-950`)
- Fix: Migration crosswalk job/learner/faculty and null actor policy; convert IST.

## G2-15-014-009  [P1] GAP  facet F04  effort L
- Legacy: Long numeric round ID and integer jobId/seq. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:23-32`)
- vNext now: UUID round/job and integer sequence. (`src/db/schema/placements.ts:1222-1233`)
- Fix: Define numeric-to-UUID ID crosswalk with stable import/order.

## G2-15-014-011  [P1] GAP  facet F04  effort M
- Legacy: Mode and nullable scheduledDate LocalDateTime. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:40-47`)
- vNext now: Mode and timestamptz scheduledAt + timezone. (`src/db/schema/placements.ts:1234-1238`)
- Fix: Convert legacy local scheduled date/time to timestamp+explicit IST zone.

## G2-15-014-066  [P1] GAP  facet F22  effort L
- Legacy: BIGINT id, INT job_id and seq. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:23-32`)
- vNext now: UUID id/jobId, sequence INT, FK restrict. (`src/db/schema/placements.ts:1222-1233`)
- Fix: Map legacy round/job IDs and preserve seq.

## G2-15-014-067  [P1] GAP  facet F22  effort L
- Legacy: Nullable local datetime and metadata columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:40-68`)
- vNext now: Timestamptz + required timezone pair, renamed testUrl/dueAt, extra assessmentDueAt. (`src/db/schema/placements.ts:1234-1248`)
- Fix: Migrate time fields with explicit zone and retain all descriptions/links.
