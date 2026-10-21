# Work packet: edit src/modules/placements/application-service.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-19/apply-to-job-request.md, docs/audit/gap2/lane-20/job-service.md, docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-18-011-049  [P1] GAP  facet F12  effort L
- Legacy: Legacy one accepted offer per learner, cascade to other active applications (`JobServiceImpl.java:1168-1255,1325-1390`).
- vNext now: New offer decision model and placement college rules maxHeldOffers/uplift, different statuses (`learner-offer-decision-model.ts:3-19`; `application-service.ts:786-805`).
- Fix: Cross-check offer acceptance cross-application cascade against college max-held offers rules.

## G2-18-011-052  [P1] GAP  facet F13  effort M
- Legacy: Legacy screening failure after apply logged but application still submitted (`JobServiceImpl.java:726-819`).
- vNext now: New screening separately persisted and driven by service, no failure in initial apply path (`application-service.ts:856-870`; `placements.ts:1114-1170`).
- Fix: Ensure failed screening preserves submitted application and offers retry/FAILED state.

## G2-18-011-053  [P1] GAP  facet F13  effort M
- Legacy: Legacy withdrawn early reapply sets status APPLIED, reruns screening (`JobServiceImpl.java:580-637`).
- vNext now: New reapply resets SUBMITTED and writes history without immediate screening in restored branch (`application-service.ts:839-853`).
- Fix: Queue fresh screening or reset stale prior result after restore.

## G2-18-011-061  [P1] MISSING  facet F18  effort M
- Legacy: Legacy apply-too-fast exact `Too many applications in the last minute. Please try again shortly.` (`JobServiceImpl.java:424-436`).
- vNext now: New no comparable limiter/copy in mapped application-service (`application-service.ts:570-654`).
- Fix: Add rate limiter and exact 429 message.

## G2-19-021-046  [P1] GAP  facet F21  effort L
- Legacy: Old job applicant resume can differ from profile document. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:651-661`
- vNext now: vNext application row carries no selected resume data. `src/modules/placements/application-service.ts:856-867`
- Fix: Store per-application snapshot rather than silently replacing with profile.

## G2-19-021-049  [P1] GAP  facet F22  effort L
- Legacy: Old application resume_url, resume_history data are persisted. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-69` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:599-618`
- vNext now: vNext insert does not persist resume or history. `src/modules/placements/application-service.ts:856-867`
- Fix: Extend migration/schema to preserve historical applicant resume snapshots.

## G2-20-012-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET visible only org/target/active/deadline by specification `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:48-70`
- vNext now: New self-apply depends on membership/college and placement participation/module grants `src/modules/placements/application-service.ts:89-102,107-120`
- Fix: Audit whether learners without module grant lose formerly visible opportunities

## G2-20-012-011  [P1] GAP  facet F05  effort M
- Legacy: Global getAllActiveJobs deprecated due cross-org data leakage `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:24-38`
- vNext now: New loadJob(jobId) initially selects by UUID without tenant predicate `src/modules/placements/application-service.ts:74-86`
- Fix: Verify every caller scopes job to active college before returning record or applying

## G2-20-012-015  [P1] GAP  facet F07  effort L
- Legacy: Legacy class docs explicitly say no eligibility hard check before apply `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:11-20,73-93`
- vNext now: New uses evaluatePlacementEligibility and placementApplyEligibilityDenial `src/modules/placements/application-service.ts:53-55`
- Fix: Clarify product rule whether academic evidence/percentage may block apply, test targeted-but-low-score candidate

## G2-20-012-023  [P1] GAP  facet F11  effort S
- Legacy: Legacy visibility gated targeting, not candidate eligibility attributes `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:48-59`
- vNext now: New may gate by placement eligibility policies and academic evidence `src/modules/placements/application-service.ts:53-55`
- Fix: Owner choose hard visibility policy; document academic threshold behavior explicitly

## G2-20-012-040  [P1] GAP  facet F23  effort M
- Legacy: Legacy philosophical hard targeting only, no hard eligibility before apply `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:11-20`
- vNext now: New candidate eligibility service and debarment gates used at apply `src/modules/placements/application-service.ts:53-66`
- Fix: Owner clarify deliberate rule evolution and expose why user can't apply

## G2-3-013-018  [P1] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `1267-1275`
- Fix: Legacy catches history save failure and does not fail main status mutation; vNext inserts history inside placement application transaction, so audit failure can rollback primary action. Decide policy and show clean retry response.

## G2-3-013-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:87-96`, `132-140`, `180-189`
- vNext now: `src/modules/placements/application-service.ts:848-882`, `1267-1275`
- Fix: Legacy status recorder covers TPO system moves, bulk moves and undo transitions, not only learner application lifecycle; vNext main history writes submission/reapplication/withdrawal only. Merge adjacent stage and screening histories to provide complete audit.

## G2-5-013-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy application paging supports status/minScore/maxScore/appliedAfter/appliedBefore/source/department/program/batch/search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:68-71`)
- vNext now: vNext listPlacementJobApplications receives only jobId (`src/modules/placements/application-service.ts:1011-1020`)
- Fix: Expose all 10 filters and server page size/sort with data-safe search

## G2-5-013-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy getJobApplicationsPaginated accepts rich filters and Pageable (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:68-71`)
- vNext now: vNext listPlacementJobApplications takes only jobId and returns array (`src/modules/placements/application-service.ts:1011-1035`)
- Fix: Create filtered/paged backed query and list metadata

## G2-5-013-076  [P1] GAP  facet F19  effort M
- Legacy: Legacy application export applies same visible filters and cap (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1933-1945`)
- vNext now: vNext application reader lacks filters/pagination (`src/modules/placements/application-service.ts:1011-1035`)
- Fix: Bound queries and export to displayed filter state

## G2-5-015-021  [P1] GAP  facet F08  effort M
- Legacy: Legacy recorder catches persistence errors and leaves parent transition intact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- vNext now: Application and status history inserted atomically in transaction `src/modules/placements/application-service.ts:856-882`
- Fix: Decide/document fail-open vs audited atomicity and user recovery.

## G2-6-015-006  [P1] GAP  facet F04  effort M
- Legacy: First appliedAt is immutable LocalDateTime (JobApplication.java:35-37).
- vNext now: submittedAt timestamp timezone and overwritten on restore (placements.ts:1007-1011; application-service.ts:839-844).
- Fix: Preserve first submission timestamp separately from latest resubmission.

## G2-6-027-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy job read allows org/college admin or learner with matching resolved organization (JobController.java:976-996).
- vNext now: vNext learner feed uses collegeId and membership; job application list manager scope (learner-job-service.ts:131-147; application-service.ts:1011-1018).
- Fix: Audit cross-college organization job read and super-admin acting college scope; deny lateral reads.

## G2-6-027-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy one application per job, duplicate guard and withdrawn restoration (JobController.java:398-400,453-457).
- vNext now: vNext one application per roleOption+membership, with restore of WITHDRAWN (placements.ts:1029-1035; application-service.ts:624-645).
- Fix: Resolve multi-role cardinality and race semantics explicitly in product contract.
