# Work packet: edit src/modules/placements/tpo-drive-lifecycle-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-14-015-021  [P1] GAP  facet F10  effort L
- Legacy: Legacy REQUEST to DRAFT SENT_BACK REJECTED CANCELLED allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:18-24`
- vNext now: New TPO lifecycle accepts PUBLISH CLOSE REOPEN only `src/modules/placements/tpo-drive-lifecycle-model.ts:3-9` `src/modules/placements/tpo-drive-lifecycle-model.ts:38-65`
- Fix: Reconcile missing request review actions in appropriate request service

## G2-14-015-025  [P1] GAP  facet F10  effort M
- Legacy: Legacy CLOSED and CANCELLED terminal, no outgoing transitions `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:33-35`
- vNext now: New TPO offers REOPEN from CLOSED to PUBLISHED `src/modules/placements/tpo-drive-lifecycle-model.ts:38-64` `src/modules/placements/tpo-drive-lifecycle-service.ts:187-197`
- Fix: Document intentional reopening extension and its safety gates

## G2-8-011-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy lifecycle statuses REQUEST/SENT_BACK/REJECTED/DRAFT/PUBLISHED/CLOSED/CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:9-22`)
- vNext now: vNext primary drive lifecycle only DRAFT/PUBLISHED/CLOSED; cancel separate, request in recruiter workflow (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9,38-45; src/modules/placements/tpo-drive-cancel-service.ts:82-100`)
- Fix: Map requests, sent-back, rejected and cancelled into canonical states with explicit route/action labels

## G2-8-011-004  [P1] GAP  facet F02  effort M
- Legacy: Published state is a terminal outbound transition to CLOSED or CANCELLED only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:30-35`)
- vNext now: vNext supports CLOSED→PUBLISHED REOPEN (`src/modules/placements/tpo-drive-lifecycle-model.ts:38-65`)
- Fix: Reopen needs explicit owner decision and safe blocker policy; not legacy semantics

## G2-8-011-027  [P1] GAP  facet F12  effort M
- Legacy: REJECTED/CLOSED/CANCELLED terminal no outgoing transitions (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:33-35`)
- vNext now: new CLOSED→PUBLISHED via REOPEN (`src/modules/placements/tpo-drive-lifecycle-model.ts:38-65`)
- Fix: Retain terminal semantics unless owner approves reopen with audited safeguards

## G2-14-015-015  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid transition includes current and next status in thrown message `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-50`
- vNext now: New uses blockers STALE_JOB_STATUS and human explanations `src/modules/placements/tpo-drive-lifecycle-model.ts:38-84`
- Fix: Retain actionable transition errors with source/destination

## G2-8-011-014  [P2] GAP  facet F07  effort S
- Legacy: New job illegal initial transition throws `New drive must start as DRAFT or REQUEST` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:40-46`)
- vNext now: vNext invalid requested action returns strict Zod or placement read-only error (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9; src/modules/placements/tpo-drive-lifecycle-service.ts:178-185`)
- Fix: Map original error meaning to clear UI rather than generic read-only

## G2-8-011-015  [P2] GAP  facet F07  effort S
- Legacy: Illegal transition message `Invalid drive lifecycle transition: <from> -> <to>` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-50`)
- vNext now: new readiness reason `The drive status has changed. Refresh the page.` or other specific blockers (`src/modules/placements/tpo-drive-lifecycle-model.ts:68-84`)
- Fix: Maintain precise stale vs unsupported transition errors in page, no raw internals
