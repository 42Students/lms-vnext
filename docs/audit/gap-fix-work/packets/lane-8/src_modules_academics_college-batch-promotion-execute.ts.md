# Work packet: edit src/modules/academics/college-batch-promotion-execute.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-2-029-065  [P1] GAP  facet F12  effort M
- Legacy: BatchServiceImpl.java:312-320 previews current/target faculty assignment counts and deactivation.
- vNext now: college-batch-promotion-execute.ts:103-138 ends old-only course assignments; computes facultySetupIncomplete.
- Fix: Report exact deactivation forecast and maintain old vs retained shared-course assignment semantics.

## G2-2-029-102  [P1] GAP  facet F22  effort L
- Legacy: BatchServiceImpl.java:312-320 faculty batch-semester assignment relation.
- vNext now: college-batch-promotion-execute.ts:87-138 ends only old-course offerings/teaching assignments.
- Fix: Audit historic course/semester assignment transitions and shared-offering retention.

## G2-5-021-049  [P1] GAP  facet F22  effort L
- Legacy: Legacy batch table numeric ID, name/program/date/count/status/semester/year `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:10-48`
- vNext now: VNext cohorts UUID, code/program/start-period/status/date/year; progression separate `src/db/schema/academics.ts:126-163` `src/modules/academics/college-batch-promotion-execute.ts:139-151`
- Fix: Write migration field map + progression event backfill, including status enum.

## G2-14-031-029  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-183 promote transaction emits BATCH_PROMOTE
- vNext now: src/modules/academics/college-batch-promotion-execute.ts:39-196 locks cohort and CAS transitions, logs activity
- Fix: Reconcile learner section/teaching transition effects against legacy batch service

## G2-14-031-036  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:230-258 direct current semester update
- vNext now: src/modules/academics/college-batch-promotion-execute.ts:65-85 requires versioned guarded promotion
- Fix: Decide if controlled correction workflow replaces unrestricted old setter

## G2-14-031-051  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:159-175 promotion changes downstream semester/class effects
- vNext now: src/modules/academics/college-batch-promotion-execute.ts:87-171 rotates assignments and term state
- Fix: Confirm attendance, timetable, placement eligibility and faculty screens all refresh after progression

## G2-9-002-055  [P1] GAP  facet F12  effort M
- Legacy: Deactivates assignments for old batch semester (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:155-183`)
- vNext now: Only old-only courses deactivated; shared target courses retained (`src/modules/academics/college-batch-promotion-execute.ts:88-135`)
- Fix: Compare exact side effect and obtain product approval.

## G2-9-002-079  [P1] GAP  facet F21  effort M
- Legacy: Java teaching assignment service deactivation (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:154-187`)
- vNext now: Drizzle close old-only course assignments (`src/modules/academics/college-batch-promotion-execute.ts:88-135`)
- Fix: Reconcile downstream class/course assignment effects before enabling.

## G2-9-028-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores semester, academicYear and COMPLETED status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138,177-183`
- vNext now: Cohort stores status; progression state stores term/year/version `src/db/schema/academics.ts:130-164` `src/modules/academics/college-batch-promotion-execute.ts:137-154`
- Fix: Map migrations and dual academicYear display/read behavior

## G2-9-022-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy Batch stores semester, academicYear and COMPLETED status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:124-138,177-183`
- vNext now: Cohort stores status; progression state stores term/year/version `src/db/schema/academics.ts:130-164` `src/modules/academics/college-batch-promotion-execute.ts:137-154`
- Fix: Map migrations and dual academicYear display/read behavior

## G2-5-021-024  [P2] GAP  facet F07  effort S
- Legacy: Legacy promotion stale error 'Batch was modified by another request. Please refresh and try again.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:173-179`
- vNext now: VNext PROMOTION_STALE/PROMOTION_PREVIEW_CHANGED codes `src/modules/academics/college-batch-promotion-execute.ts:25-29,62-85`
- Fix: Map codes to explicit refresh/preview recovery copy.

## G2-5-021-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy promote success builds BatchResponseDTO from saved batch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/BatchServiceImpl.java:187-195`
- vNext now: New returns cohortId,term,year,version,learnerCount,assignment flags `src/modules/academics/college-batch-promotion-execute.ts:171-179`
- Fix: Keep key success detail/status counts in UI.

## G2-14-031-025  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/BatchController.java:183-185 'Batch promoted to semester N'
- vNext now: src/modules/academics/college-batch-promotion-execute.ts:155-177 responds term number/version
- Fix: Render legacy message with returned term number

## G2-9-002-033  [P2] GAP  facet F07  effort M
- Legacy: On revalidation mismatch says This batch changed after you opened the dialog (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:231-249`)
- vNext now: Returns PROMOTION_STALE or PREVIEW_CHANGED (`src/modules/academics/college-batch-promotion-execute.ts:47-84`)
- Fix: Resolve conflict codes to refresh-and-review text.
