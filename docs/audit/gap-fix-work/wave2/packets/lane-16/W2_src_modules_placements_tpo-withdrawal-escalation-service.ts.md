# Work packet (wave 2): edit src/modules/placements/tpo-withdrawal-escalation-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-017  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:51-52 — `tpo.escalateWithdrawals` lease 12 min.
- vNext now: src/modules/placements/tpo-withdrawal-escalation-service.ts:7-11 — Job idempotency via event dedupe, not named lease.
- Fix: Use lease plus existing event dedupe, or document concurrency equivalence.

## G2-17-010-038  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-40 — Explicit Asia/Kolkata date windows for daily cron.
- vNext now: src/modules/placements/tpo-withdrawal-escalation-service.ts:14-20 — Withdrawal 24-hour lookahead uses UTC Date instants, not calendar IST.
- Fix: For daily date-bound jobs use IST calendar-day boundaries and test DST/UTC.

## G2-17-010-039  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:51-52 — Short interval escalation every 15 min, lease 12 min.
- vNext now: src/modules/placements/tpo-withdrawal-escalation-service.ts:14-20 — Exact 24-hour boundary inclusive; no lease definition.
- Fix: Configure interval+lease and preserve inclusive 24h cut-off.
