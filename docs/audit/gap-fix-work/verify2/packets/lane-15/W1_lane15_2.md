# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-015-008 [P1] GAP facet F05
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:24-27 — startDate/endDate SQL Date per class
- Expected fix: Expose class dates explicitly or calculate from academic period with known precedence

## G2-18-015-012 [P1] GAP facet F07
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:157-167 — duplicate name checked by batch or program in Java
- Expected fix: Reconcile duplicate scope and inactive reuse behavior

## G2-18-015-018 [P1] GAP facet F11
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:35-42 — GROUP_BACKED roster access through active lms_group_member
- Expected fix: Maintain live elective group-membership audience

## G2-18-015-022 [P1] GAP facet F13
- Files: src/modules/academics/college-academic-directory-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:22-26 — unpaged list includes group-backed even if paged list excludes
- Expected fix: Include group-backed in content audiences without polluting paged classes list

## G2-18-015-032 [P1] GAP facet F21
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:81-123 — course targeting union includes teaching assignments and electives
- Expected fix: Keep canonical audience query across semester/group/explicit assignment

## G2-18-015-035 [P1] GAP facet F22
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/_Class.java:20-46 — name, desc, two dates, upper/lower, classType, rosterGroup
- Expected fix: Publish full legacy-to-new column map including missing type/group/dates

## G2-18-015-036 [P1] GAP facet F23
- Files: src/db/schema/academics.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/_ClassRepository.java:22-26 — group-backed also in unpaged course target selection
- Expected fix: Resolve feature design: elective group-backed audience vs academic sections

## G2-19-031-128 [P1] GAP facet F22
- Files: src/db/schema/discussions.ts
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V73__classroom_messages.sql:1-13` — MySQL classroom_messages course/class, sender snapshot, soft delete and pin indexes.
- Expected fix: Build identity/schema mapping preserving class and tombstone.

## G2-1-009-006 [P1] MISSING facet F03
- Files: src/app/(authenticated)/learn/profile/data-access/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:36-55`: data-access view should identify company, job and external recipient.
- Expected fix: Render named recipient, job, share time and download time for each relevant share.

## G2-1-009-009 [P1] MISSING facet F04
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:34-35`: tenthPct BigDecimal.
- Expected fix: Read verified 10th percent, convert basis points to percentage, label source.

## G2-1-009-010 [P1] MISSING facet F04
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:37-38`: twelfthPct BigDecimal.
- Expected fix: Read verified 12th percent and format percent accurately.

## G2-1-009-011 [P1] MISSING facet F04
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:40-41`: diplomaPct BigDecimal.
- Expected fix: Add diploma percentage and absence placeholder.

## G2-1-009-055 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:19-70`: learner_academic_record keyed integer learner_id with cgpa/percent/gap/source/import metadata.
- Expected fix: Map all 13 legacy columns into canonical per-member evidence or snapshot; add provenance and indexes.

## G2-1-004-037 [P1] GAP facet F10
- Files: src/db/schema/profiles.ts, src/modules/people/learner-profile-document-edit-service.ts
- Legacy: `LearnerProfileServiceImpl.java:83-1044` persists JPA Learner, Qualification, JobPreferences and storage refs.
- Expected fix: Write field-by-field parity/migration recipe respecting current no-data-migration decision.

## G2-1-004-061 [P1] GAP facet F22
- Files: src/db/schema/profiles.ts
- Legacy: `LearnerProfileServiceImpl.java:83-1044` maps Learner/Qualification/JobPreferences and private refs.
- Expected fix: Document full old→new field schema with no PII migration until owner approves.

## G2-14-023-026 [P1] GAP facet F10
- Files: src/modules/placements/learner-support-request-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:52-55 — mine returns all types from student_request table.
- Expected fix: Unify personal history across both request types.

## G2-15-018-001 [P1] GAP facet F01
- Files: src/db/schema/db10-log-alerts.draft.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:14-17 — JPA entity backs log-alert-signature known errors.
- Expected fix: Register DB10 migrations/export prior to declaring feature live.

## G2-15-018-006 [P1] GAP facet F04
- Files: src/db/schema/db10-log-alerts.draft.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:19-27 — Long AUTO_INCREMENT PK, env and hash strings.
- Expected fix: Migrate numeric signature IDs to UUID, preserve external issue links.

## G2-15-018-044 [P1] GAP facet F22
- Files: src/db/schema/db10-log-alerts.draft.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — table singular log_alert_signature, BIGINT id, unique env+hash.
- Expected fix: Register transformed migration and provide ID crosswalk.

## G2-15-018-049 [P1] GAP facet F23
- Files: src/db/schema/db10-log-alerts.draft.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — operational table created by executed migration.
- Expected fix: Verify registered migration+schema barrel before deployment.

## G2-18-014-002 [P1] GAP facet F01
- Files: src/db/schema/db10-outbound-messages.draft.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-23 — email suppression state shared across college contexts by emailNorm primary key.
- Expected fix: Ensure all college EMAIL sending paths use the global suppression gate.

## G2-18-014-005 [P1] GAP facet F04
- Files: src/db/schema/db10-outbound-messages.draft.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:21-23 — raw normalized email address as primary key.
- Expected fix: Use irreversible canonical global HMAC with stable key and migration crosswalk.

## G2-18-014-039 [P1] GAP facet F22
- Files: src/db/schema/db10-outbound-messages.draft.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — email_suppression raw email VARCHAR150 PK, reason nullable VARCHAR255, DATETIME created.
- Expected fix: Write migration/verification map for raw addresses with privacy-safe rekey.

## G2-18-014-041 [P1] GAP facet F22
- Files: src/db/schema/db10-outbound-messages.draft.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:345-349 — production DDL in V161.
- Expected fix: Register production schema and pass disposable PostgreSQL migration replay.

## G2-19-020-041 [P1] GAP facet F22
- Files: src/db/schema/db10-bug-tracker.ts, drizzle/0076_db10_announcements_bug_tracker.sql
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:12-37 — bug_tracker_access numeric ID, hash unique, role, active, two LocalDateTime fields.
- Expected fix: Migrate account access IDs safely; exclude seeded fixed token hashes.
