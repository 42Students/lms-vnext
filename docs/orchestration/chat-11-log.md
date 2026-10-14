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

## C — Completed meeting notes (2026-10-14)
- Dedicated scoped Mentor completed-meeting outcome detail/edit page.
- Confirmed CAS PATCH with same-origin, current Mentor membership grant,
  strict Zod, transactional before/after-presence audit without raw note text.
- Team meeting log deep links; loading/error, mobile forms and isolated
  positive/foreign/wrong-role/stale PostgreSQL tests authored, not executed.
- PARTIAL: browser, lint/typecheck, PostgreSQL and history/privacy signoff.

## D — exact-project risk/readiness drill-in (2026-10-14)
- Added Mentor-only /mentor/projects/[projectId]/risk-readiness linked from
  project workspace; exact current Mentor permission and college scope.
- Evidence-only state-based attention and readiness checkpoints with deep links,
  filters, pagination, responsive cards and missing-evidence honesty. Read-only.
- Pure projection and positive/foreign/wrong-role PostgreSQL test fixtures
  authored but not run in this session.
- PARTIAL: real test/browser/legacy verification; no predictive score, assignee,
  workload or unregistered staleness claims.

### Post-item self-review cleanup
- Converted CSV download anchors to Next Link on the two Mentor export pages.
- Moved readiness metric descriptors outside JSX to match repository lint rules.
- No behavior or scope changes; CI/tooling still unexecuted in this session.


## E — Mentor latest-version review notifications (2026-10-14)
- Replaced filtered-only historical SUBMITTED selection with latest registered
  project submission version selection before creating REVIEW attention.
- Pure model/units and disposable PostgreSQL project/mentor fixture authored,
  with positive, foreign, wrong-role, disabled role-grant assertions.
- Read-only: no isSameOriginRequest or mutation token required.
- PARTIAL pending executed tools, browser and alert-producer regression proof.


## F — Global Mentor Meetings calendar filters and IST display (2026-10-14)
- Exact current Mentor cross-project calendar gets strictly validated status
  and case-insensitive meeting/project search controls.
- All dates/MISSED boundaries display in Asia/Kolkata per approved decision.
- Added central projects.read guard and isolated PG role/foreign/disabled
  fixture plus pure model unit coverage; tests not run here.
- PARTIAL: authenticated browser/download parity, paging and CLI/DB evidence.


## G — Mentor scheduled meeting reschedule (2026-10-14)
- Confirmed IST wall-clock modal with exact-project PATCH and same-origin guard.
- Active assigned Mentor, central projects.read, locked project/meeting,
  SQL millisecond CAS and same-project overlapping meeting denial.
- Transactional sanitized activity; declared conflict code, source-authored
  model/unit and isolated PostgreSQL success/stale/foreign/role tests.
- PARTIAL: tests/browser unexecuted and cross-project collision policy unresolved.


## H — Mentor exact-project activity export (2026-10-14)
- Read-only GET export, max 200 scoped persisted events using existing Mentor
  project/college/permission checks and redacted event projection.
- Formula-neutralized CSV, IST dates, explicit truncation and no raw metadata.
- Unit and unique-fixture positive/role/foreign/disabled PostgreSQL tests
  authored; no runtime test results claimed.
- PARTIAL pending desktop/mobile download and actual CI/PG checks.
