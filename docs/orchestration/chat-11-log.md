# Chat 11 — Mentor work log

## A — task state transitions (2026-10-14)
- Branch: `chatgpt/chat-11`, synchronized from `main` before this item.
- Confirmed Mentor-only TODO / IN_PROGRESS / BLOCKED transitions with active
  Sprint and non-shipped Release guards, millisecond SQL CAS and single-transaction
  immutable activity audit. DONE and IN_REVIEW require task submission review.
- Pure unit and isolated PostgreSQL fixture tests authored, not executed.
- PARTIAL: run tsc, eslint, vitest, PostgreSQL, mobile/browser and compare
  legacy workflow; task assignee/workload persistence not present.

## B — sprint/board filters and exports (2026-10-14)
- Board Sprint ID/priority/status/search filtering, 500-row sanitized CSV
  with capped overflow count and current-Mentor project checks.
- Sprint portfolio state/search export, 100-row cap and overflow notice;
  existing same-college active project membership scope reused.
- Unit and positive/foreign/role-denial PostgreSQL source tests added,
  not executed; no owner decision required.
- PARTIAL: browser/download, test execution, legacy column parity and
  large-export strategy remain.
