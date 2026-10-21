# Work packet: edit src/db/schema/placement-college-application-stages.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md, docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-10-008-119  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35` legacy immutable history records old/new status, changedAt, actor
- vNext now: `src/db/schema/placement-college-application-stages.ts:1-55` new college application stages schema and `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60` only current stage
- Fix: Preserve historical transitions in equivalent vNext schema and use for funnel/time-to-shortlist

## G2-10-011-055  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-40 — Single canonical applicationStatus updated with timestamp/actor.
- vNext now: src/db/schema/placement-college-application-stages.ts:5-22; src/modules/placements/college-application-stage-service.ts:152-165 — New stage lives apart from base placementApplications.status, with separate move event and history.
- Fix: Display/persist consistent canonical status vs stage and explain current pipeline projection.

## G2-10-011-084  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:39-46,133-141 — JobApplication carries statusUpdatedAt/by and version optimistic token.
- vNext now: src/db/schema/placement-college-application-stages.ts:6-35 — Separate stage row carries movedAt, movedBy, version with distinct history.
- Fix: Project last-updated actor/time and preserve version checks for candidate edits.

## G2-5-015-047  [P1] GAP  facet F22  effort L
- Legacy: Legacy history collects status transitions in one table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:19-35`
- vNext now: VNext separates college application stage and stage history `src/db/schema/placement-college-application-stages.ts:5-35`
- Fix: Unify multi-table history projection; prevent lost or duplicated migrated events.

## G2-9-010-058  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-40` — JobApplication.applicationStatus persisted APPLIED etc with statusUpdatedAt/by
- vNext now: `src/db/schema/placement-college-application-stages.ts:6-16` — College stage stored separately from placementApplications.status and has actor/reason/version
- Fix: Document stage snapshot projection and distinguish canonical application status in UI

## G2-9-014-093  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:13-35` — MySQL job_application unique learner_id/job_id, status string APPLIED, statusUpdatedAt, appliedAt.
- vNext now: `src/db/schema/placement-college-application-stages.ts:4-15` — Separate college application stages with unique applicationId and enum-check; actual application row separate.
- Fix: Reconcile single-status vs dual application/status/stage model.

## G2-9-014-095  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:69-114` — Rejection reason varchar500, notes text, offer letter URL, statusBeforeWithdrawal.
- vNext now: `src/db/schema/placement-college-application-stages.ts:4-40` — Stage/history store reason/version; richer offer/notes elsewhere, not in shortlist page.
- Fix: Map legacy reason/history/document fields to normalized relations and drawer.

## G2-9-014-096  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:115-124` — @Version optimistic lock on JobApplication.
- vNext now: `src/db/schema/placement-college-application-stages.ts:4-22` — Stage uses integer version and history row; distinct application concurrency model.
- Fix: Verify CAS guarantees for stage transitions and applicant edits.
