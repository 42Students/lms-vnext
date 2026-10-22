# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-020-008 [P1] GAP facet F04
- Files: src/db/schema/academics.ts
- Legacy: ClassSchedule.java:16-23 classId/courseId/facultyId ints, courseSlug transient
- Expected fix: Document full mapping (class->section, courseId->deliveryId/offering, facultyId->membership) including elective and shared events

## G2-18-020-009 [P1] GAP facet F04
- Files: src/db/schema/academics.ts
- Legacy: ClassSchedule.java:24-27 startTime/endTime Java String columns
- Expected fix: Parse legacy timestamp/IST wall clock and display correctly; never compare strings lexicographically on ingestion

## G2-18-020-016 [P1] GAP facet F05
- Files: src/db/schema/academics.ts, src/db/schema/attendance.ts
- Legacy: ClassScheduleRepository.java:17-18 all scheduled count vs :31-43 held count for denominator
- Expected fix: Use startsAt<=now and SCHEDULED/held policy for denominator, never include future or cancelled; per-course count too

## G2-18-020-032 [P1] GAP facet F12
- Files: src/db/schema/academics.ts
- Legacy: ClassScheduleRepository.java:31-43 held-session denominator only started events
- Expected fix: Exclude cancelled and future even if old count included scheduled, reconcile historical denominator methodology

## G2-18-020-034 [P1] GAP facet F12
- Files: src/db/schema/academics.ts
- Legacy: ClassScheduleRepository.java:137-165 faculty/class/room double-book guards
- Expected fix: Add serializable clash guard or Postgres exclusion constraints and precise conflict reason

## G2-18-020-044 [P1] GAP facet F20
- Files: src/db/schema/academics.ts
- Legacy: ClassScheduleRepository.java:137-165 uses start<newEnd and end>newStart half-open overlap
- Expected fix: Test exact touching boundary, concurrent create race, timezone IST-midnight and DST-neutral dates

## G2-18-020-047 [P1] GAP facet F22
- Files: src/db/schema/academics.ts
- Legacy: ClassSchedule.java:10-35 table class_schedule BaseModel ID/int, class_id int, course_id int, faculty_id int, start_time/end_time strings, hall int, title, marked_at Timestamp, deleted/created/updated inherited
- Expected fix: Provide field-by-field schema map including absent course column and split attendance marker, note no data migration

## G2-18-020-048 [P1] GAP facet F22
- Files: src/db/schema/academics.ts
- Legacy: ClassScheduleRepository.java:17-18,31-43 is_deleted filter on every attendance-related count
- Expected fix: Map deletions to cancellation and update denominator queries, preserve legacy held denominator semantics

## G2-18-020-049 [P1] GAP facet F22
- Files: src/db/schema/academics.ts
- Legacy: ClassScheduleRepository.java:137-165 application conflict queries not DB constraints
- Expected fix: Add exclusion/race-safe conflict enforcement in migration; indexes alone do not prohibit overlaps

## G2-19-019-039 [P1] GAP facet F13
- Files: src/modules/people/college-faculty-detail-service.ts
- Legacy: FacultyTeachingAssignmentServiceImpl.java:201-236 annotates unresolved faculty/course/class/batch as metadataIncomplete, does not present healthy unnamed entity
- Expected fix: Expose orphan/degraded records in authorized admin audit instead of silently filtering them via joins

## G2-13-012-028 [P1] GAP facet F12
- Files: src/modules/placements/public-work-email-policy.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-99` blocks full resource-backed personal/disposable/academic domain lists
- Expected fix: Compare and migrate complete legacy blocklists and academic suffixes; keep centrally refreshed policy

## G2-13-014-056 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-35` int id, learner_id,job_id,application_status/organizationId/appliedAt/is_deleted from BaseModel
- Expected fix: Create migration crosswalk for legacy learner/job/application IDs and organization derivation, retain status history

## G2-13-014-057 [P1] GAP facet F22
- Files: src/db/schema/placements.ts, src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30` legacy lifecycle APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED
- Expected fix: Map all legacy business states to round/screening/offer entities for search results and counts

## G2-13-014-059 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:67-70` partition by organization_id, no DB index itself
- Expected fix: Define org-wide join/index strategy before recreating legacy cross-job organization search

## G2-13-010-006 [P1] GAP facet F03
- Files: src/db/schema/placements.ts
- Legacy: Legacy statuses have APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/WAITLISTED/HIRED/REJECTED/WITHDRAWN labels (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:18-57`)
- Expected fix: Crosswalk stage/source for every label and withdrawn indicator.

## G2-13-010-055 [P1] GAP facet F20
- Files: src/db/schema/placements.ts
- Legacy: Old WITHDRAWN terminal in status map but reapply workaround exists (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:45-50`)
- Expected fix: Audit reapply gate and withdrawnAt nulling under optimistic concurrency.

## G2-13-010-058 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Old status stored on JobApplication.applicationStatus as coarse enum (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:56-65`)
- Expected fix: Write 9-stage→status+screening+stage+offer joined migration crosswalk.

## G2-13-010-059 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Old JobApplicationStatusHistory stores each stage move with actor/message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:63-76`)
- Expected fix: Ensure stage history rows and learner-visible messages preserved after migration.

## G2-13-015-001 [P1] GAP facet F01
- Files: src/db/schema/placements.ts, src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:18-29`,35-40 offer record is separated from job_application.status; initial SELECTED before verified RELEASED
- Expected fix: Introduce explicitly persisted pre-release selection/verification decision or map legacy SELECTED accurately to separate vNext selection table

## G2-13-015-002 [P1] GAP facet F01
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` eight business states SELECTED,PENDING_VERIFICATION,RELEASED,ACCEPTED,DECLINED,EXPIRED,WITHDRAWN,REVOKED
- Expected fix: Document status crosswalk and implement UI/workflow parity for pending verification and revoked states

## G2-13-015-007 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:31-36` Long id and Integer applicationId foreign logical reference
- Expected fix: Produce legacy-to-vNext offer ID crosswalk and guarantee dependent application links rekey correctly

## G2-13-015-008 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:42-49` roleOptionName nullable; ctcLpa/fixedLpa as BigDecimal
- Expected fix: Convert BigDecimal lakh package to integer INR precisely; preserve null and independent breakdown

## G2-13-015-012 [P1] GAP facet F04
- Files: src/db/schema/placements.ts, src/modules/placements/tpo-joining-followup-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:73-87` acceptance channel, 48-hour disputable timestamp, joiningStatus, cascadeId
- Expected fix: Reconstruct joiningStatus as vNext joining outcome record and verify cascade identifiers/data retention

## G2-13-015-014 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:108-118` createdAt/updatedAt and @Version optimistic lock
- Expected fix: Separate source optimistic lock version from offer issuance revision and migrate original timestamps

## G2-13-015-028 [P1] GAP facet F10
- Files: src/db/schema/placements.ts, src/modules/placements/offer-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:98-165` release changes underlying legacy JobApplication to OFFERED
- Expected fix: Translate OFFERED via offer table status/history not application status; ensure learner Offers discoverability
