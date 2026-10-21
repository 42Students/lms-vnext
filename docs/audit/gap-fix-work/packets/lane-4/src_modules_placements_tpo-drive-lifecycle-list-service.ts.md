# Work packet: edit src/modules/placements/tpo-drive-lifecycle-list-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-11-012-024  [P1] GAP  facet F04  effort M
- Legacy: Tab count computed via client rows REQUEST/SENT_BACK etc. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:163`
- vNext now: vNext requests counted from recruiter request table separate from job statuses. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:70`
- Fix: Map approved/rejected/sent-back request rows and tab badge parity.

## G2-11-012-046  [P1] GAP  facet F07  effort M
- Legacy: Counts failure uses Could not load applicant and pipeline counts. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:153`
- vNext now: Aggregate DB failure propagates; no partial count warning. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:79`
- Fix: Fail-open list with count-dependent filters disabled and warning.

## G2-11-012-064  [P1] GAP  facet F12  effort L
- Legacy: Requests tab includes REQUEST+SENT_BACK jobs. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:26`
- vNext now: New Requests tab uses separate recruiter request records including cancelled/rejected history. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:89`
- Fix: Unify request lifecycle projection and label mapping.

## G2-11-012-093  [P1] GAP  facet F20  effort M
- Legacy: Failed counts fetch keeps previous valid counts. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:146`
- vNext now: Server aggregate failure stops page; no persisted last counts. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:79`
- Fix: Cache verified counts with stale marker.

## G2-11-012-098  [P1] GAP  facet F22  effort L
- Legacy: Legacy statuses include SENT_BACK/REQUEST/REJECTED inside Job lifecycle. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:43`
- vNext now: Recruiter requests separate entity, published jobs in placementJobs. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:89`
- Fix: Provide faithful UI projection for multi-entity status history.

## G2-19-011-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy no page shell; change later reflected via absence from active job listings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- vNext now: vNext TPO live counters count any status PUBLISHED, even overdue `src/modules/placements/tpo-drive-lifecycle-list-service.ts:61-65` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:79-85`
- Fix: Make post-deadline 'Applications closed' distinct from live accepting applications.

## G2-19-011-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy field `isActive` changed false, applicationDeadline preserved `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-65` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:89-90` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-121`
- vNext now: vNext keeps applicationDeadline TIMESTAMPTZ while status remains PUBLISHED until manual transition `src/db/schema/placements.ts:510-515` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65`
- Fix: Introduce effective-application-state or persistent expiry status.

## G2-19-011-012  [P1] GAP  facet F05  effort L
- Legacy: Legacy repository batch selects all active non-draft, non-deleted past-deadline rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:181-188`
- vNext now: vNext TPO overdue filter restricts PUBLISHED plus `<now`, scoped college and season `src/modules/placements/tpo-drive-lifecycle-list-service.ts:191-202` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:240-245`
- Fix: System sweep must cover every tenant and season, independently of UI filters.

## G2-19-011-018  [P1] GAP  facet F07  effort M
- Legacy: Legacy filters out inactive/deleted/draft `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188`
- vNext now: vNext status enum and archival guard can represent non-published exclusion `src/db/schema/placements.ts:566-569` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:197-213`
- Fix: Sweep only published, non-archived records with safe status CAS.

## G2-3-023-046  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:64-110`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:14-57`
- vNext now: `src/modules/placements/job-service.ts:150-417`, `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`
- Fix: Integer Job/DriveForm, lastSaver, nullable tenant pointers vs UUID company+season+role options require explicit historical mapping.

## G2-11-012-047  [P2] GAP  facet F07  effort M
- Legacy: Batch failure Could not load batch names retained list and retry. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:187`
- vNext now: Batch query failure rejects whole page. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:40`
- Fix: Preserve main list and warn incomplete batch options.

## G2-11-012-048  [P2] GAP  facet F07  effort M
- Legacy: Team failure Could not load drive owner names with retry. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:198`
- vNext now: Owners query errors reject whole request. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:36`
- Fix: Isolate owner-name data failure.
