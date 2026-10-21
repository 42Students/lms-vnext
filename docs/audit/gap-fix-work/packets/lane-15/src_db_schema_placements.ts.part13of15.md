# Work packet: edit src/db/schema/placements.ts (part 13 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-6/job-preferences.md, docs/audit/gap2/lane-8/job-application-status-history.md, docs/audit/gap2/lane-8/job-round.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md

## G2-5-015-028  [P1] GAP  facet F12  effort L
- Legacy: Status strings arbitrary after trim; no enum enforced by writer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-45`
- vNext now: Schema constrained to SUBMITTED and WITHDRAWN  `src/db/schema/placements.ts:1097-1108`
- Fix: Split and migrate all legacy pipeline statuses into typed event tables.

## G2-5-015-049  [P1] MISSING  facet F23  effort M
- Legacy: Legacy last-rejection stage text derived from history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:846-853,924-932`
- vNext now: VNext application status timeline lacks rejected events `src/db/schema/placements.ts:1097-1108`
- Fix: Implement projection from separate stage/round history with legacy wording.

## G2-6-019-013  [P1] MISSING  facet F04  effort M
- Legacy: Legacy papInterest Yes/No/Need more info (JobPreferences.java:38-39).
- vNext now: vNext profile jobPreferences omits PAP interest, placement preferences omit field (profile-validation.ts:510-518; placements.ts:295-352).
- Fix: Map PAP interest into a confidential placement assistance preference or explicit program enrollment record.

## G2-6-019-048  [P1] GAP  facet F22  effort L
- Legacy: Legacy table job_preferences extends BaseModel int PK, learner_id unique, role/specific/shift/city/exam/PAP/notification fields (JobPreferences.java:10-45; BaseModel.java:22-37).
- vNext now: VNext stores role/specific/shift/city in learner_profiles.profile_document JSON and placement choices separately, no direct job_preferences table (profiles.ts:15-31; placements.ts:295-370; profile-validation.ts:510-518).
- Fix: Create complete 1:1 field ownership map with PAP/exam/notification retention; add migration transform only if data import requested.

## G2-8-019-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-20 application_id INT required
- vNext now: src/db/schema/placements.ts:1068-1072 UUID FK required
- Fix: Migrate exact numeric application mapping to UUID.

## G2-8-019-008  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:22-23 old_status VARCHAR50 nullable
- vNext now: src/db/schema/placements.ts:1073,1096-1099 fromStatus VARCHAR24 limited enum
- Fix: Split legacy recruiting-stage status from application lifecycle.

## G2-8-019-009  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:25-26 new_status VARCHAR50 required
- vNext now: src/db/schema/placements.ts:1074,1100-1108 toStatus SUBMITTED/WITHDRAWN only
- Fix: Map REJECTED, APPLIED, stages and offers into appropriate vNext histories.

## G2-8-019-011  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:31-32 changed_by nullable INT
- vNext now: src/db/schema/placements.ts:1075-1079 actorUserId required UUID
- Fix: Allow unknown/system legacy actors or map to provenance actor.

## G2-8-019-019  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-32,49-52 invalid skipped with warning; persistence failure logged
- vNext now: src/db/schema/placements.ts:1096-1108 DB-level check errors
- Fix: Convert invalid transition to safe mapped error and coherent UI feedback.

## G2-8-019-031  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36 no-op if status unchanged
- vNext now: src/db/schema/placements.ts:1105-1108 only SUBMITTED to WITHDRAWN and back
- Fix: Preserve complete stage history independently from application lifecycle.

## G2-8-019-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:4-17 MySQL int AUTO PK and soft-delete/timestamps
- vNext now: src/db/schema/placements.ts:1067,1083-1087 UUID and createdAt only
- Fix: Map numeric history ID, tombstones and local timestamp to UUID schema.

## G2-8-019-053  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:22-23 old_status VARCHAR50
- vNext now: src/db/schema/placements.ts:1073,1096-1099 from_status VARCHAR24, enum restriction
- Fix: Provide lossless legacy stage-status mapping.

## G2-8-019-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:25-26 new_status VARCHAR50
- vNext now: src/db/schema/placements.ts:1074,1100-1108 to_status VARCHAR24, 2 states
- Fix: Archive/migrate legacy REJECTED/OFFERED statuses to correct history table.

## G2-8-019-056  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:31-32 changed_by nullable int
- vNext now: src/db/schema/placements.ts:1075-1079 actorUserId UUID not null
- Fix: Support unidentified legacy event actor or system actor provenance.

## G2-8-015-004  [P1] GAP  facet F02  effort M
- Legacy: Round scheduledDate LocalDateTime timezone-unspecified (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:44-46`)
- vNext now: VNext scheduledAt timestamptz plus timezone string, pair check (`src/db/schema/placements.ts:1235-1238,1310-1313`)
- Fix: Convert legacy wall-clock using college IST and preserve display timezone

## G2-15-026-062  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:19-130 legacy job integer PK, organizationId required, collegeId optional, free text company
- vNext now: src/db/schema/placements.ts:placementJobs scoped to college/season/company relationship and UUID PK
- Fix: Document job table column mapping and redesign of mandatory college/season/company link

## G2-15-026-063  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-46 and 88-133 status/notes/score/version stored in one JPA entity
- vNext now: src/db/schema/placements.ts:placementApplications plus placementApplicationScreenings, placementOffers, collegeStages
- Fix: Map each legacy application field/status to normalized tables and audit source of truth

## G2-18-022-051  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:1-140 statuses SELECTED/RELEASED/REVOKED/EXTERNAL_IMPORT
- vNext now: src/db/schema/placements.ts:placementOffers status ISSUED/ACCEPTED/... and offer status history, UUID IDs
- Fix: Document exhaustive legacy→vNext offer state/fields/actor/CTC mapping

## G2-9-004-051  [P1] MISSING  facet F11  effort M
- Legacy: Internal notes placement-team-only (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:509-518`)
- vNext now: Trust/owner college relationship private; no notes field (`src/db/schema/placements.ts:81-140`)
- Fix: Store notes per relationship with need-to-know permissions.

## G2-9-004-084  [P1] GAP  facet F22  effort M
- Legacy: Single company record holds logo URL, website, contact, notes, deleted marker (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:184-193`)
- vNext now: placement_companies canonical + placement_company_relationships scoped join (`src/db/schema/placements.ts:20-125`)
- Fix: Map every legacy field, with private contact/notes on relationship not global identity.
