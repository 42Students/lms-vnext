# chat-2 Placements interview, round and slot coverage ledger

Status: **in progress — source-authored, cloud CI pending**. Branch `chatgpt/chat-2-b`. This is a focused behavioural slice, **not** a claim of exhaustive module coverage. No tests were run by this lane.

| Export / boundary | Test | Behaviour covered |
| --- | --- | --- |
| `roundApplyInputSchema` | `tests/unit/chat2-round-interview-boundary-hardening.test.ts` — TPO-drive-workspace-42 accepts only confirmed SHA-256 round previews | Exact 64-character lowercase SHA-256 digest, confirm requirement, strict unknown-field denial |
| `roundApplyPreviewToken` | Same file — TPO-drive-workspace-42 binds apply approval to row versions, states, identities and round | Identity, state, version, round and deterministic order |
| `summarizeRoundApply` | Same file — TPO-drive-workspace-42 counts persisted round states only | STAGED versus APPLIED counts and outcomes |
| `roundApplyFailureReason` | Same file — TPO-drive-workspace-42 counts persisted round states only | Sanitized non-sensitive failure wording |
| `roundReorderLockMessage` | Same file — TPO-drive-workspace-37 locks unknown, ended and in-progress rounds | Open plan, ended/unknown drive, execution artifacts, non-pending rounds, insufficient rounds |
| `moveRound` | Same file — TPO-drive-workspace-37 rejects duplicate IDs | Valid move, missing ID, non-integer or out-of-range index, duplicate IDs, immutable inputs |
| `tpoInterviewSlotActionSchema` | Same file — TPO-drive-workspace-44 accepts only explicit confirmed bounded slot actions | Valid booking, confirmed action, positive version, UUID and strict field validation |
| `sameInterviewRoom` | Same file — TPO-drive-workspace-44 compares rooms canonically | NFKC, trim, case folding |
| `overlapsInterviewRoom` | Same file — TPO-drive-workspace-44 compares rooms canonically | Overlapping and touching windows, separate physical rooms, invalid proposed date |
| `planInterviewDay` | Same file — TPO-drive-workspace-44 plans ordered slots | Multi-room schedule, duplicate names, cap, midnight in IST |
| `tpoLiveRoundTiming` | Same file — TPO-drive-workspace-44 uses server time | Elapsed, pre-start, impossible duration |
| `projectTpoInterviewReadiness` | Same file — TPO-drive-workspace-44 readiness refuses impossible durations | Upcoming, missing schedule, impossible duration, cancelled and TALK exclusions |
| `tpoRoundResultEntryFormSchema` | Same file — TPO-drive-workspace-40 validates hold ranks | Hold candidate message, strict rank spelling and tenant-field denial |

## Remaining Pass B work

Every route handler and service export in `src/modules/placements/*interview*`, `*round*`, and `*slot*` not listed above still needs its own entries with PostgreSQL-backed permission, tenant isolation, stale-version, rollback, audit, notification and idempotency tests. TPO last-third pages and campaigns/public/settings-people also need the full route/page matrix defined in `docs/orchestrator/queues/master-queue.md`. Source assertions alone do not establish CI pass or correct database behaviour.

## Report reconciliation

The 2026-10-18 `unit-failures-latest.md` cites CI `ff6819dd`; `typecheck-errors-latest.md` cites `39270260`. The newer `main` snapshot had already replaced the erroneous `cohorts` table binding with `cohortTable` in `tpo-prep-readiness-derived-service.ts`. Do not reintroduce the obsolete compile defect. Actual current CI must re-run to validate all named failures.
