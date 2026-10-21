# Work packet (wave 2): edit src/modules/placements/college-application-detail-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md, docs/audit/gap2/lane-3/job-application-status-history-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-2-016-073  [P2] GAP  facet F04  effort M
- Legacy: Application row includes source, PAP requested, resume, assessment link, internal notes and rejection reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:52-59,65-95`
- vNext now: New detail has source/screening/history/notes/offer data, but PAP flag not in scoped detail projection `src/modules/placements/college-application-detail-service.ts:27-47,49-79`
- Fix: Include legacy PAP requested and reason fields in a protected detailed register

## G2-2-016-089  [P2] GAP  facet F06  effort L
- Legacy: Notes PATCH allows null/empty to clear and accepts optional version CAS token `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-807`
- vNext now: New detail returns append-only TPO note entries; editing contract differs `src/modules/placements/college-application-detail-service.ts:64-69`
- Fix: Support intentional clear or edit of original internal notes with optimistic conflict guard

## G2-2-016-113  [P2] GAP  facet F10  effort M
- Legacy: GET per-app status history returns List<JobApplicationStatusHistory> `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:740-769`
- vNext now: New detail loads history (100 latest cap) `src/modules/placements/college-application-detail-service.ts:52-60`
- Fix: Page older history instead of silently truncating >100 changes

## G2-2-016-114  [P2] GAP  facet F10  effort L
- Legacy: PATCH internalNotes writes mutable field and version `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:772-827`
- vNext now: New detail joins latest 100 placementApplicationNotes records `src/modules/placements/college-application-detail-service.ts:64-69`
- Fix: Define mutable vs append-only note parity with author/version

## G2-2-016-135  [P2] GAP  facet F14  effort M
- Legacy: Legacy offer letter stores validated http(s) URL after PATCH `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:829-847`
- vNext now: New offer model uses offerLetterUrl and attached timestamp but separate offer row `src/modules/placements/college-application-detail-service.ts:74-79`
- Fix: Preserve safe URL or signed upload behavior with file rules and user-visible error

## G2-2-016-160  [P2] GAP  facet F22  effort L
- Legacy: Legacy internalNotes, rejectionReason and offerLetterUrl sit on job_application row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:88-112`
- vNext now: New histories/notes/offers normalized separately `src/modules/placements/college-application-detail-service.ts:52-79`
- Fix: Create history backfill and authoritative current projection for old field semantics

## G2-20-011-010  [P2] GAP  facet F05  effort M
- Legacy: Repository bulk query for application IDs/newStatus sorted app+date `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: New model reads per application, no equivalent batch helper `src/modules/placements/college-application-detail-service.ts:49-60`
- Fix: Provide batch status-history read for reports to avoid N+1 and preserve sorted group boundaries

## G2-20-011-032  [P2] GAP  facet F19  effort S
- Legacy: Legacy DB sorts by changedAt ASC and reads all rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: College application history query capped at 100 `src/modules/placements/college-application-detail-service.ts:55-60`
- Fix: Paginate/stream >100 transitions or show explicit 'oldest 100' indicator

## G2-3-013-012  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:15-17`
- vNext now: `src/modules/placements/college-application-detail-service.ts:55-60`
- Fix: Legacy bulk query applicationIds+newStatus, grouped applicationId ASC/changedAt ASC; vNext only single application page query. Add tenant-scoped bulk history query for reports without N+1.

## G2-3-013-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-13`
- vNext now: `src/modules/placements/college-application-detail-service.ts:55-60`, `src/modules/placements/learner-application-detail-service.ts:102-119`
- Fix: Legacy no fixed max on history list; vNext college query LIMIT100 with no pagination/truncation indicator; paged continuation or full read for long histories.

## G2-3-013-037  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: `src/modules/placements/college-application-detail-service.ts:55-60`, `src/modules/placements/learner-application-detail-service.ts:102-119`
- Fix: Legacy full ascending history and bulk query, vNext college caps at100 while learner uncapped. Add pagination/index strategy with continuation for historic high-churn applications.

## G2-5-015-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy reads all matching rows without limit `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: Staff detail caps events to 100 `src/modules/placements/college-application-detail-service.ts:55-60`
- Fix: Paginate older events or visibly state only first 100 returned.

## G2-5-015-029  [P2] GAP  facet F12  effort S
- Legacy: Latest rejection derived by ASC scan and map overwrite `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:850-853`
- vNext now: College stage reader sorts only movedAt ASC `src/modules/placements/college-application-detail-service.ts:95-102`
- Fix: Choose latest rejection deterministically via movedAt plus id.

## G2-3-013-011  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationStatusHistoryRepository.java:12-17`
- vNext now: `src/modules/placements/learner-application-detail-service.ts:102-119`, `src/modules/placements/college-application-detail-service.ts:55-60`
- Fix: Legacy sorted changedAt ASC only; vNext learner sorts createdAt ASC then id ASC, college orders createdAt ASC with limit100. Use stable tie-breaker across viewers and document time granularity.
