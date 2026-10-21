# Work packet: edit src/app/api/placements/learner/saved-jobs/[jobId]/route.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-saved-job-service.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-19-012-014  [P1] GAP  facet F06  effort L
- Legacy: Legacy service method accepts learnerId and jobId integers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LearnerSavedJobService.java:13-36`
- vNext now: vNext route accepts jobId UUID, infers learner from context `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:7-21`
- Fix: Migrate numeric route IDs to UUID and remove spoofable learnerId.

## G2-17-011-018  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-785 — Unconfigured service gives `Saved jobs not configured` 503.
- vNext now: src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:12-14 — Api error response on failed service; no identical feature-unavailable copy.
- Fix: Map infrastructure not-ready to safe user-facing unavailable message.

## G2-19-012-017  [P2] GAP  facet F07  effort S
- Legacy: Legacy controller checks positive numeric IDs, explicit 400 copy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:753-758` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:803-807`
- vNext now: vNext UUID parsing via z.string().uuid() then apiErrorResponse `src/modules/placements/saved-job-service.ts:11-11` `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:11-14`
- Fix: Map malformed UUID to comparable 400/422 UX error.

## G2-3-019-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:753-780`
- vNext now: `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-15`
- Fix: Legacy errors `Job not found`, `This job is not available for your profile`, `Saved jobs not configured`; vNext returns generic placement error code/validation. Map exact user-facing reasons, keep 404/403/503.

## G2-17-011-021  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:783-785 — Save 200 `{saved:true}` message `Job saved`.
- vNext now: src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:12-13 — Save 200 `{saved:true}` no legacy message envelope.
- Fix: Keep client-facing Saved for later toast; API success text optional.

## G2-17-011-022  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:817-820 — Unsave 200 `{saved:false}` message `Job removed from saved`.
- vNext now: src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:20-21 — DELETE returns `{removed:boolean}`, no saved false.
- Fix: Align clients relying on `saved:false` or adapter.

## G2-3-019-018  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:783-785`, `817-820`
- vNext now: `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:11-22`
- Fix: Legacy response wraps success message `Job saved`/`Job removed from saved` and `{saved}`; vNext JSON `{saved}`/`{removed}` without message. Match adapter or UI copy.
