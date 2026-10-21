# Gap-fix proof log — lane chat-5

## In progress: `docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md`

- Verified already on main (not credited as this lane's new implementation): `drizzle/0133_lanes_round_1.sql` creates `scheduled_job_leases`; `src/modules/operations/postgres-scheduled-job-lease-store.ts` implements atomic DB-time claim, unexpired holder/fence renewal, and current-holder verification. P0 rows G2-5-032-057/064 must still pass the prescribed concurrent DB test before release.
- Code authored: named legacy TPO cadence registry (all ten names, IST cron and lease durations), a fail-closed POST-only offer-expiry worker with the existing Postgres fencing store and bounded transactional batches, plus a gated dev CronJob manifest. Relevant partial rows: G2-5-032-003, -006, -008, -021, -030, -033, -052, -063.
- Not declared fixed: the rest of the 51 open rows; seven of the ten TPO jobs remain explicitly `wired: false`, notifications/provider dispatch and durable per-batch metrics are not implemented, and no production trigger or live verification is claimed.
- Queue checkbox intentionally stays unticked; the document is not complete. No typecheck, test suite, CI, cluster apply, or database execution was run.
- New files: `src/modules/operations/tpo-scheduled-job-registry.ts`, `src/modules/operations/tpo-offer-expiry-worker.ts`, `src/app/api/internal/placements/tpo/offer-expiry/run/route.ts`, `deploy/k8s/dev/placement-offer-expiry.yaml`.

### Additional partial wiring

- `tpo.escalateWithdrawals` now claims its 12-minute Postgres lease before running the existing 24-hour-window escalation, with a dev 15-minute trigger.
- `tpo.deliverDueNotices` now claims a separate 50-second lease before its existing 30-second undo-hold publisher and returns HTTP 503 when storage is not ready; a dev one-minute trigger is staged.
- Neither manifest has been applied; all other scheduled job gaps and runtime verification remain open.

### Read-only operator lease inspection (partial)

- `GET /api/internal/placements/tpo/scheduler-status` is protected by the TPO scheduler secret and returns each canonical job's cadence, handler-wired flag, active/expired/never-claimed lease and fence from PostgreSQL; DB outage returns 503. This is partial progress on G2-5-032-005/-007/-011/-027.
- It deliberately reports `lastSuccessfulRunAt: null` and `outcomesTracked: false` because durable run/outcome history has not been implemented. A claimed lease is **not** evidence of successful dispatch.
- New files: `src/modules/operations/tpo-scheduled-job-health.ts`, `src/app/api/internal/placements/tpo/scheduler-status/route.ts`.

### Recruiter digest scheduler (partial)

- Existing same-origin plus 32-byte bearer authentication is retained. The message-digest worker now claims `tpo.recruiterMessageEmails` for four minutes before its tenant-scoped, unread-only send service; a five-minute dev CronJob supplies an Origin matching the in-cluster host. Relevant partial rows G2-5-032-020/-062.
- The source service's own provider and state checks remain authoritative. Warmup at 90 seconds after startup, durable message-provider acceptance reconciliation, and real deployment checks remain incomplete; do not tick the document.
- Existing withdrawal, notice and recruiter endpoint response bodies remain unchanged on a successful run; lease contention returns an explicit `skipped` result.

### Deployment/production gate

- Added `docs/operations/tpo-scheduled-jobs-dev.md` with ten-job schedule inventory, explicit missing handlers, dev-secret and actor requirements, unchanged unsafe deployment gates, and a production **NOT READY** release hold (G2-5-032-068, -063). This documents the hold; it does not itself finish the missing implementation or verification rows.

## Wave 1 — packet 1: admin placements landing
- Packet: `docs/audit/gap-fix-work/packets/lane-5/src_app_authenticated_admin_placements_page.tsx.md` | reviewed 11 findings.
- Applied / improved: G2-17-030-038 — verified platform policy service and route persist only GLOBAL/GLOBAL, and restricted editable policy to no-college view; G2-17-030-058 — inline per-drive actions, student lookup and retention links with other routable flows retained; G2-15-026-002 — explicit direct drive-detail action; G2-10-017-033/039/048 — reused the existing scoped deadline form with date check, confirmation and result feedback on the overview; G2-17-030-022 — existing duplicate action exposed in the overview (draft-copy route, not legacy width-800 prefilling modal).
- Skipped / partial requiring shared-owner follow-up: G2-17-030-022 full 800px Create Drive/duplicate prefill; G2-10-017-033 legacy default +7 days/end-of-day and G2-10-017-048 optimistic-token contract (existing deadline component/service owned outside admin); G2-15-026-035 placement toggle and active-tenant checks on every endpoint (service/API); G2-15-026-001/037/065 unsafe organization/global aggregate list without a selected college. The existing selected-college-only membership model remains deliberately in force. See handoff-lane-5.md.
- Source-only verification: page imports, JSX tag pairs, policy scope and existing deadline/duplicate prop shapes reread. No TS compilation, code execution, CI or browser inspection.

## Wave 1 — packet 2: lecture-hall manager (part 1/3)
- Packet: `docs/audit/gap-fix-work/packets/lane-5/src_components_admin_lecture-hall-manager.tsx.part1of3.md` | reviewed 20 findings.
- Applied / improved: G2-10-018-025/041/079/089, G2-19-018-022/032, G2-4-027-035 — snapshot-based unsaved edit protection on Cancel, backdrop, Escape and close with exact legacy discard copy; G2-10-018-031, G2-9-017-033/034 — empty required room-type selection, legacy create capacity default 50 and 1–1000 client-side range; G2-9-017-007 — always-visible creation form in responsive left card; G2-19-018-027 — quoted duplicate-name feedback; G2-19-018-020 — optional department remains UUID/null (not legacy sentinel 0), avoiding unsafe API shape.
- Skipped / explicit lifecycle waiver: G2-10-018-027, G2-19-018-035/067, G2-4-027-028/073, G2-6-030-033 — archive/restore and future-booking conflict retained instead of unsafe legacy hard-delete; G2-6-030-022 — selected-college-only create retained, global picker requires service/authorization design. Service schema still accepts capacity to 5000; backend policy decision needed before changing shared service; listed in handoff-lane-5.md.
- Source-only verification: edited client component re-read for import usage, balanced section/div/form/Dialog tags, button handler signatures and field IDs. No tests, TS compilation, CI or browser inspection.

## Wave 1 — packet 3: lecture-hall manager (part 2/3)
- Packet: `docs/audit/gap-fix-work/packets/lane-5/src_components_admin_lecture-hall-manager.tsx.part2of3.md` | reviewed 20 findings.
- Applied or already implemented: G2-9-017-036/041/049/061/063/089 — part-1 dirty confirmation, mandatory room type, 1–1000 client capacity and normalized edit snapshot; G2-9-017-095 — max255 name/description and required room type on client, backend 5000 difference handed off; G2-10-018-030/032/035 — exact blank-name error plus native two-row Textarea in create and edit; G2-19-018-025/026, G2-4-027-026/027/029, G2-6-030-031 — room type, same-college department feedback, quoted duplicate name, field-level name guidance and separate min/max/integer capacity messages.
- Intentionally skipped: G2-10-018-038, G2-19-018-030, G2-4-027-030 — retain Archive/Restore semantics and truthful status-specific feedback, not legacy deletion toast. Backend max5000 vs UI max1000 deliberately not changed without product/backend owner decision.
- Validation boundary: source-only TSX import/prop/tag review; no TS execution or browser/CI.

## Wave 1 — packet 4: lecture-hall manager (part 3/3)
- Packet: `docs/audit/gap-fix-work/packets/lane-5/src_components_admin_lecture-hall-manager.tsx.part3of3.md` | reviewed 10 findings.
- Applied or already implemented: G2-6-030-034, G2-9-017-039/040/042/046, G2-10-018-033/036, G2-19-018-024/028 — exact create/update success via copy constants, required name/type plus inline name error, "College is required." guard, per-create "Could not create the room. Try again." and per-edit "Could not save the room. Try again.", optional department placeholder "Select department", and two-row description fields.
- Intentionally skipped: G2-9-017-047 — archive/restore is not legacy physical deletion, so show truthful "Lecture hall archived"/"Lecture hall restored", with explicit preserved-schedule-history explanation. The backend continues blocking future bookings on archive.
- Validation boundary: existing shared Textarea checked for native props/rows; no TS execution or CI.
