# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l17-u028-workspace-readiness.md

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u028-workspace-readiness.md

## G2-17-028-008  [P1] MISSING  facet F03 Proof metric  effort M
- Legacy: LR:23-28 counts completed resolvedTasks with nonempty submissionUrl; LO:33-38 `Proof coverage X / Y completed tasks` or `No completed tasks yet`
- vNext now: NS:34-71 reads tasks statuses/submissions but returns aggregate counts only; NW:72-82 omits proof coverage
- Fix: Add scoped per-task evidence coverage read (completed tasks with submission URL) to service/DTO and legacy-labeled metric with zero-completion special text

## G2-17-028-011  [P1] GAP  facet F04 Releases  effort M
- Legacy: LD:14-19 counts shipped/total informational only in legacy DTO
- vNext now: NS:100-107 requires releases.length>0 and all SHIPPED for executionComplete
- Fix: Product decision: keep legacy readiness independent of release shipping or explicitly document change and update visible rule/warning; don't silently reinterpret gate

## G2-17-028-018  [P1] GAP  facet F06 Override values  effort M
- Legacy: Legacy linked override form POST at LA:470-471 sends legacy Boolean override + note (LC:688-705)
- vNext now: NF:93-96 uses FORCE_UNLOCK/FORCE_BLOCK/CLEAR and NO:29-56 persists activity event
- Fix: Crosswalk nullable Boolean true/false/null to enum, and preserve clear semantics and active override display

## G2-17-028-024  [P1] GAP  facet F10 Read API  effort M
- Legacy: LH:28-55 calls LA:388 GET `/api/v1/admin/projects/{id}?collegeId=`, gets embedded readiness and resolvedTasks
- vNext now: NW:28-32 directly calls NS:22-155 on server; NR:14-29 also offers GET readiness
- Fix: Use one scoped workspace view/readiness shape or BFF with embedded proof tasks; avoid an extra unsynchronized fetch for coverage

## G2-17-028-025  [P1] GAP  facet F10 Override API  effort M
- Legacy: LR:66 navigates only; LC:688-705 separate POST `/api/v1/admin/projects/{id}/readiness/override` with collegeId/override/note
- vNext now: NF:52-56 POST `/api/projects/{id}/readiness/override` enum state/note
- Fix: Keep business intent equivalent through payload/status mapping, reject outside-scope IDs; align parent form behavior

## G2-17-028-026  [P1] GAP  facet F10 Audit side effect  effort M
- Legacy: LM:1-42 stores override/noteby/at columns on project_workspace
- vNext now: NO:16-26 reads latest PROJECTS_READINESS_OVERRIDDEN activity and NO:48-55 inserts activity event
- Fix: Ensure latest state and author/time still visible after migration, including cleared override and old records

## G2-17-028-027  [P1] GAP  facet F11 Superadmin scope  effort M
- Legacy: LR:12-16 uses selectedCollegeId; no-scope branch LR:30-49 keeps shell and college-selection banner
- vNext now: NW:28-39 requireProjectManageAccess and generic unavailable; selected college missing-state not in local page
- Fix: Render distinct `No college selected` shell/banner on missing selected scope; never suppress nav tabs

## G2-17-028-029  [P1] GAP  facet F12 Readiness predicate  effort M
- Legacy: LO:28 displays readyForSubmission calculated by backend (LD:7-9); release count comment LD:14-17 says informational only
- vNext now: NS:100-115 `executionComplete` requires all releases, sprints, tasks and correct project status
- Fix: Align readiness gate formula with legacy: verify task/sprint completion and submission conditions, make release policy decision before parity sign-off

## G2-17-028-040  [P1] GAP  facet F20 Task status edge  effort S
- Legacy: LR:25 treats statuses containing COMPLET or exactly DONE as complete, and evidence only truthy submissionUrl
- vNext now: NS:90-95 counts DONE exactly; no coverage
- Fix: Clarify status normalization for migrated tasks; count submissions that are valid URLs, not whitespace or stale data; test zero tasks

## G2-17-028-044  [P1] GAP  facet F22 Legacy storage  effort M
- Legacy: LM:3-42 adds nullable readiness_override BOOLEAN, note TEXT, by INT, at DATETIME to project_workspace
- vNext now: NO:16-26 reads activityEvents metadata and actors; no equivalent mutable columns
- Fix: Preserve historical override read model or migrate records to append-only activity events (no data migration desired? confirm on live old data)

## G2-17-028-045  [P1] GAP  facet F22 Readiness DTO  effort M
- Legacy: LD:7-27 flat readyForSubmission, readinessState, reason, counters, submissionStatus, overrideAt/name
- vNext now: NS:117-155 nested execution/release/submission/readinessOverride with different codes
- Fix: Publish explicit DTO mapping including readinessState/reason and proofCoverage; avoid UI comparing non-equivalent flags

## G2-17-028-047  [P1] MISSING  facet F23 Dropped content  effort M
- Legacy: LO:30-42 overall progress and proof coverage; LO:76-105 dedicated override-active/empty banner
- vNext now: NW:59-90 omits combined progress, proof and empty banner
- Fix: Restore distinct missing legacy regions; record expected zero-count and override-off screenshots
