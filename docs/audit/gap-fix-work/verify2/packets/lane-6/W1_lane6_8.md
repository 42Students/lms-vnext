# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-011-076 [P1] GAP facet F21
- Files: src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy publishes ApplicationStatusChangedEvent and after commit async status emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1268-1273` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:2004-2024`
- Expected fix: Guarantee outbox/after commit delivery for equivalent notifications

## G2-14-012-030 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy accepts any nonblank fromAddressOverride and replyTo `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- Expected fix: Require approved domain and verified sender alias for all template paths

## G2-14-012-034 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy default from-name may be overridden but not address validated `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- Expected fix: Validate sender aliases and reply-to for equivalent calls

## G2-14-012-055 [P1] GAP facet F20
- Files: src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Legacy sender/reply address overrides only trim, not domain constrained `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:123-132`
- Expected fix: Implement approved sender/reply address domain policy across notification events

## G2-14-015-002 [P1] GAP facet F01
- Files: src/modules/placements/validation.ts
- Legacy: Legacy REQUEST and SENT_BACK are recruiter request lifecycle states `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:10-13`
- Expected fix: Map recruiter request workflow into separate typed request statuses and navigation

## G2-14-015-012 [P1] GAP facet F06
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy new drive starts REQUEST or DRAFT only `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-46`
- Expected fix: Route recruiter-request intake into distinct persisted request path

## G2-14-015-026 [P1] GAP facet F11
- Files: src/modules/placements/job-service.ts, src/modules/placements/tpo-drive-lifecycle-service.ts
- Legacy: Legacy JobLifecycleService only writer of lifecycleStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:10-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- Expected fix: Centralize allowed transition checks to prevent permission/path divergence

## G2-14-017-046 [P1] GAP facet F15
- Files: src/modules/projects/mentor-sprint-write-service.ts
- Legacy: Legacy entity contains creator/updater and lifecycle attribution `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:102-120`
- Expected fix: Preserve provenance in durable event or projected columns

## G2-14-020-004 [P1] GAP facet F02
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy company link page can preview, OTP, join and see metrics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:117-198`
- Expected fix: Build full company join flow parity tied to selected relationship

## G2-14-020-016 [P1] GAP facet F06
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy link requires company domain first; rotates old link `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-89`
- Expected fix: Provide company-domain verified join link creation and rotation

## G2-14-020-019 [P1] GAP facet F06
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy join email must match company domain, code verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:218-229`
- Expected fix: Enable verified self-join with OTP before grant

## G2-14-020-021 [P1] MISSING facet F07
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy invalid token says This link is no longer valid `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:212-216`
- Expected fix: Implement invalid/expired token page with safe generic message

## G2-14-020-030 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy company join reactivates recruiter access in selected college `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:246-276`
- Expected fix: Map public verified join into grant with required expiry and verification

## G2-14-020-035 [P1] GAP facet F11
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy company join requires email domain ownership and code `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165`
- Expected fix: Require work email OTP verified to domain before grant

## G2-14-020-042 [P1] MISSING facet F13
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy invalid joining token returns generic LINK_INVALID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:212-216`
- Expected fix: Add a safe expired/invalid link state

## G2-14-020-045 [P1] GAP facet F15
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy successful join rings TPO bell and sends recruiter welcome email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-197` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:235-243`
- Expected fix: Deliver targeted officer bell and recruiter welcome once

## G2-14-020-057 [P1] GAP facet F21
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy CompanyJoinService integrates OTP email and bell `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:137-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:186-197`
- Expected fix: Add secure OTP and transactional event/outbox for joining

## G2-15-015-017 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: type allowed INCLUDE/EXCLUDE and reason trimmed >=3. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:384-389`)
- Expected fix: Require at least three characters on override form/API, preserve 1000 upper guard.

## G2-18-013-008 [P1] GAP facet F04
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy DTO fields id, title, companyName/companyLogo, description/responsibilities, type/location, CTC, dates, active, org/college, target department/program IDs/names; JobSearchDTO.java:19-38;JobSearchCache.java:188-207
- Expected fix: Create per-field DTO adapter with safe datetime/CTC, target names and explicit unavailable semantics

## G2-18-013-009 [P1] GAP facet F04
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy departmentCache loads all Department names by ID and programCache filters deleted NewProgram; JobSearchCache.java:148-175
- Expected fix: Verify program/department naming consistency across legacy old and vNext new academic model

## G2-18-013-022 [P1] GAP facet F10
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy source includes all active and not deleted jobs from JobRepository.findAllActiveJobs; JobSearchCache.java:121-135;JobRepository.java:42-74
- Expected fix: Declare new source of truth and map old isActive/isDeleted into published/archived semantics

## G2-18-013-029 [P1] GAP facet F12
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy category from jobType, active jobs only; JobSearchCache.java:109-111,121-135
- Expected fix: Define mapping of status/jobType to roleOption employmentType, validate null

## G2-18-013-030 [P1] GAP facet F13
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy no jobs yields empty list; loadJobs silently catches backend errors; JobSearchCache.java:116-143
- Expected fix: Distinguish no placement access/enrollment from genuinely no jobs, preserve actionable empty-state explanation

## G2-18-013-038 [P1] GAP facet F19
- Files: src/modules/placements/learner-job-service.ts, src/modules/placements/learner-jobs-browse-model.ts
- Legacy: Legacy loads all jobs+reference data in process memory at startup, partitions per organization; JobSearchCache.java:52-63,116-175
- Expected fix: Benchmark 10k concurrent users and large college jobs; add server paging/search if list grows, no global cache leakage

## G2-18-013-044 [P1] GAP facet F21
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy cache depends DepartmentRepository, NewProgramRepository, JobRepository and GenericSearchCache; JobSearchCache.java:6-11,36-50
- Expected fix: Map joins/indexes and cache removal effects for load and publish

### Lane-5 fast verification triage (2026-10-22)
- **G2-14-011-076 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-012-030 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-012-034 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-012-055 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-015-002 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-015-012 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-015-026 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-017-046 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-004 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-016 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-019 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-021 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-030 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-035 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-042 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-045 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-14-020-057 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-15-015-017 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-008 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-009 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-022 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-029 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-030 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-038 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
- **G2-18-013-044 — DEFERRED**: Requires full lifecycle, policy, data or UI behavior comparison beyond source presence; no parity claim.
