# Work packet: edit src/db/schema/placements.ts (part 9 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-3/l11-u019-tpo-recruiter-lead-detail.md, docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-3/l12-u014-job-application-search-controller.md

## G2-3-013-044  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35`, `docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:4-18`
- vNext now: `src/db/schema/placements.ts:1064-1110`, `drizzle/0021_placements_p5_application_history.sql:1-17`
- Fix: Legacy MySQL INT PK, nullable actor and soft-delete, varchar50 status/reason500, cascade delete with separate changed index. vNext UUID PK/required actor/timestamptz/text reason, restrictive FK, narrow enum. Provide migration/mapping, preserve historical records.

## G2-3-015-002  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:18-20`
- vNext now: `src/db/schema/placements.ts:462-513`, `src/modules/placements/college-drive-read-service.ts:24-29`
- Fix: Legacy recruiter request list filters recruiterId+collegeId and sorts job id DESC; vNext recruiter requests use distinct placement_drive_requests and recruiter/college scopes. Provide compatible join/list for old requests or record intentional migration.

## G2-3-015-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-120`
- vNext now: `src/db/schema/placements.ts:462-540`
- Fix: Legacy permits lookup by int ID/slug and includes deleted org jobs for application history; vNext UUID ID and no jobSlug column in placementJobs. Add redirects/legacy ID mapping for historical bookmarks and deleted jobs.

## G2-3-015-024  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:160-171`
- vNext now: `src/modules/placements/scope.ts:8-36`, `src/db/schema/placements.ts:465-473`
- Fix: Legacy reassignOrganizationForCollege updates denormalized orgId on jobs and increments version; vNext jobs store collegeId only and derive org through college; no reassign job mutation needed but ensure tenants follow college reassignment atomically.

## G2-3-015-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:58-76`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:114-146`
- vNext now: `src/db/schema/placements.ts:462-619`
- Fix: Legacy Job INT ID, org/college nullable relationships, isActive/isDraft/isDeleted, visibilityType and jobSlug; vNext placement_jobs UUID/non-null college+season, status enum and archivedAt, no matching slug/visibilityType. Document conversion and indexes.

## G2-3-015-049  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:148-171`
- vNext now: `src/db/schema/placements.ts:462-548`
- Fix: Legacy @Version optimistic integer increments on soft delete and org reassignment, vNext jobs updatedAt timestamp and status constraints. Preserve CAS semantics at write boundaries.

## G2-3-011-050  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:42-53`, `172-176`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:58-64`, `74-76`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/db/schema/placements.ts:496-498`, `570-573`
- Fix: Legacy tpo_college_settings.job_types_json stores hidden/custom and job.job_type/counts_as_placed; vNext type table stores row-based label/active/is_builtin/version while jobs have restricted enum and no placed flag. Map models, retain historical values.

## G2-3-011-052  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:75-86`, `155-170`
- vNext now: `src/db/schema/tpo-configuration.ts:22-38`, `src/db/schema/placements.ts:462-574`
- Fix: Legacy usage guard and rename join by job_type string; new employmentType cannot represent custom label or FK to job type, so in-use safety cannot be enforced. Add stable type reference/backward compatible bridge.

## G2-11-019-075  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:40-40`
- vNext now: `src/db/schema/placements.ts:160-184`
- Fix: Legacy recruiterLeadId numeric and activity/followups integer IDs vs vNext UUID placementTpoLeads, college-scoped activity/followups, contact-normalization; ETL.

## G2-11-022-075  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- vNext now: `src/db/schema/placements.ts:973-1113`
- Fix: Legacy summary uses JobApplication/Offer legacy numeric models and unique placed/accepted learner aggregation; vNext UUID applications/offers/placements, policy-derived placedAt. Document migration denominator mapping.

## G2-12-014-013  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:15-21`
- vNext now: `src/db/schema/placements.ts:973-1019`
- Fix: Legacy numeric IDs and organizationId on application DTO replaced with UUID application/job/membership; college selected through Job→College, roleOptionId added.

## G2-12-014-064  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:13-29`
- vNext now: `src/db/schema/placements.ts:973-1061`
- Fix: Legacy JobApplication numeric ID and OrgFK plus applicationStatus, vNext UUID job/roleOption/membership and SUBMITTED/WITHDRAWN, historical status ETL necessary.

## G2-13-019-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:19-27`
- vNext now: `src/db/schema/placements.ts:462-479`
- Fix: Numeric JPA Job and BaseModel soft-delete replace with UUID college/season/companyRelationship FKs.

## G2-13-019-002  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:285-291`
- vNext now: `src/db/schema/placements.ts:567-618`
- Fix: Legacy REQUEST/SENT_BACK/REJECTED states no longer represented in placement_jobs status enum.

## G2-13-019-007  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:54-64`
- vNext now: `src/db/schema/placements.ts:496-518`
- Fix: recordedOutside and countsAsPlaced exact per-job flags not present in placement_jobs. Map suppression/report semantics.

## G2-13-019-020  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:384-409`
- vNext now: `src/db/schema/placements.ts:613-618`
- Fix: Legacy @PrePersist/@PreUpdate auto-reconciles draft/active/status flags; DB now enforces lifecycle timestamps, migration must rewrite.

## G2-13-019-022  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:127-134`
- vNext now: `src/db/schema/placements.ts:465-478`
- Fix: Legacy organizationId required, collegeId optional; vNext collegeId/season/relationship required.

## G2-13-019-023  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:243-247`
- vNext now: `src/db/schema/placements.ts:482-495`
- Fix: Legacy assessmentUrl @JsonIgnore; vNext nested assessmentUrl field requires strict public DTO redaction.

## G2-13-019-030  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:66-68`
- vNext now: `src/db/schema/placements.ts:482-495`
- Fix: Legacy jdUrl PDF/Word uploaded file link lacks direct job column; preserve as signed storage metadata.

## G2-13-019-035  [P1] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:195-198`
- vNext now: `src/db/schema/placements.ts:481-495`
- Fix: Legacy evaluationConfig WRITE_ONLY on incoming generic Job update but hidden in responses; no direct vNext table equivalent.
