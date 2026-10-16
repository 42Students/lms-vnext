# Chat-5 staged schema / scheduler registration handoff

Status: **source committed to main; migrations NOT registered; runtime acceptance NOT performed**.
These proposals must be registered by the orchestrator in the authoritative numbered migration series, applied to disposable PostgreSQL, and certified before enabling the dependent actions. This note does not mark any audit gap DONE.

## Proposed migrations (registration order)

1. `chat-5-drive-selections.sql` — TPO-drive-workspace-47/48: record selection, verify, then release offer.
2. `chat-5-interview-candidate-slots.sql` — TPO-drive-workspace-44: candidate-specific interview slots, rooms, bookings and reschedules.
3. `chat-5-waitlist-promotions.sql` — TPO-drive-workspace-53: once-per-seat ranked waitlist promotion; canonical offer issuer checks applied HOLD exception.
4. `chat-5-drive-change-requests.sql` — TPO-drive-workspace-60: college/company requests and discussion.
5. `chat-5-college-application-stages.sql` — COL-placements-01: College Admin application stages and immutable history.
6. `chat-5-screening-reinstatement.sql` — COL-placements-01: append-only screening correction edge REJECTED → PENDING for reinstatement.
7. `chat-5-college-interviews.sql` — COL-placements-04: College Admin candidate interviews, schedule edits, cancellations and outcomes.

Services probe for new table existence and render visible not-registered states. Reinstatement also requires the history check-constraint replacement; the database otherwise rejects the action.

## Scheduler integration

`TPO-requests-verification-05`: `POST /api/internal/placements/tpo/withdrawal-escalations/run` uses the existing `TPO_NOTICE_SCHEDULER_SECRET` and `x-tpo-scheduler-key` credential scheme. A deployment scheduler must invoke the POST hourly. It is never triggered by a GET or by reading a page. Each request escalates at most once through the `activity_events.dedupe_key` guard; absence/no-show writers now reject pending-withdrawal learners.

## Outstanding acceptance

- Run typecheck, lint, tests, build and disposable-PostgreSQL migration replay **later**, per owner FAST MODE instruction; none were run in this source-only batch.
- Verify role/tenant boundaries, parallel writes and idempotency of selection release, promotions, room assignment, pipeline reinstatement and notifications.
- Verify the scheduler secret, cadence and authorized delivery. Do not assume adding an endpoint schedules it.
- Compare full legacy parity for COL-placements-01 (all-filter bulk selection, resume/offer details, full stage transition matrix) and COL-placements-04 (application drawer deep-links), and TPO-drive-workspace-28 (apply-on-behalf opt-out). These remain open.
- Security-sensitive TPO-drive-workspace-65 stays SKIP awaiting owner disposition; do not loosen company sharing.

Do not set WP-chat-5-01 or WP-chat-5-02 to DONE without acceptance. Use `docs/orchestrator/queues/chat-5.md` as the ordered work list.
