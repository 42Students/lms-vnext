# Chat 8 · TPO offers, joining, reports and companies
## 2026-10-14 · Item 1 / L323 PARTIAL
Implemented persisted drive-level offer register, status filters, and role/college-scoped read with authored unit/PG tests. No runtime gates executed. Legacy selection workflow, full offer history, pagination, browser evidence remain.

## 2026-10-14 · Item 2 / L326 PARTIAL
Offer detail with recorded status and joining transitions, deterministic ordering, role+college scope and explicit non-evidence semantics. Unit and PG tests authored, unrun. No letter delivery, storage or external send.

## 2026-10-14 · Item 3 / L195 PARTIAL
Company hiring pulse adds active published drive, recorded season, unique accepted and explicitly joined learner counts plus event recency. Scoped via canonical college relationship, no fuzzy company name joins. Pure unit and existing fixture PG tests authored, not executed.

## 2026-10-14 · Item 4 / L552 + L556 PARTIAL
Added actionable report-to-record navigation for offers and joining reports. Links sourced only from scoped persisted report rows; UUID-filtered and capped to 100 with honest warning. Existing CSV/export semantics preserved. Pure unit and isolated PG tests authored, not executed. Legacy filter/export and browser acceptance remain.
