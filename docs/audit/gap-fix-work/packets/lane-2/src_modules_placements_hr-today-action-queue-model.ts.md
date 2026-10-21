# Work packet: edit src/modules/placements/hr-today-action-queue-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-home.md

## G2-13-002-022  [P1] GAP  facet F05  effort M
- Legacy: Old lists every task sent from Today API (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:105-107`)
- vNext now: New caps source lists to 3, 5 or 8 per category (`src/modules/placements/hr-today-action-queue-model.ts:19-83`)
- Fix: Show suppressed task count and See all link; no silent task omission.

## G2-13-002-036  [P1] GAP  facet F09  effort M
- Legacy: Waiting tasks with null action deliberately have no button (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:56-74`)
- vNext now: New generic review action always links live jobs, even without confirmed work (`src/modules/placements/hr-today-action-queue-model.ts:75-78`)
- Fix: Remove non-actionable generic task links unless persisted work is due.

## G2-13-002-043  [P1] GAP  facet F11  effort M
- Legacy: Unshared APPLIED applications are shown as waiting, without action (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:109-122`)
- vNext now: New review links exist for first 3 published jobs regardless applicant count (`src/modules/placements/hr-today-action-queue-model.ts:75-78`)
- Fix: Only produce unreviewed shared-applicant CTA when verified positive count.

## G2-13-002-046  [P1] MISSING  facet F12  effort M
- Legacy: Old drive review invited via tpo_audit_log adds `Review it` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:100-107`)
- vNext now: New action queue has no dedicated prelive review-invited category (`src/modules/placements/hr-today-action-queue-model.ts:19-83`)
- Fix: Restore prelive review alert and correct route.

## G2-13-002-047  [P1] GAP  facet F12  effort L
- Legacy: Old unreviewed applicants need APPLIED, absent recruiter result, published and visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:109-122`)
- vNext now: New generic reviews only check live job existence (`src/modules/placements/hr-today-action-queue-model.ts:75-78`)
- Fix: Enforce persistent reviewable applicant predicate and exact count.

## G2-13-002-048  [P1] GAP  facet F12  effort L
- Legacy: Old result due task excludes completed/TALK/submitted results, time window -14/+2 days (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:135-145`)
- vNext now: New due projection warns deadline alone not proof outstanding (`src/modules/placements/hr-today-action-queue-model.ts:52-58`)
- Fix: Either restore query predicates or label as information, not needs-action.

## G2-13-002-078  [P1] GAP  facet F22  effort L
- Legacy: Old offer statuses RELEASED / SELECTED / PENDING_VERIFICATION drive distinct tasks (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:148-170`)
- vNext now: New ISSUED / ACCEPTED / DECLINED handling misses old pending selection tally (`src/modules/placements/hr-today-action-queue-model.ts:31-39`)
- Fix: Map statuses and maintain waiting-selection semantics.
