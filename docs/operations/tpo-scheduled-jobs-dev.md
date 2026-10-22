# TPO scheduled jobs — dev wiring and release hold

This page inventories the **legacy** TPO scheduler keys without treating a
repository YAML file as a deployed production timer. Source of truth:
`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java`.
The typed contract is `src/modules/operations/tpo-scheduled-job-registry.ts`.

## Named legacy schedules (Asia/Kolkata)

| Lease job key | Intended schedule | Lease | Dev handler |
| --- | --- | --- | --- |
| `tpo.deadlineToday` | 08:00 daily | 30 min | **Not wired** |
| `tpo.offersExpiringSoon` | hourly | 50 min | **Not wired** |
| `tpo.shortlistDueTomorrow` | 08:00 daily | 30 min | **Not wired** |
| `tpo.escalateWithdrawals` | every 15 min | 12 min | POST `/api/internal/placements/tpo/withdrawal-escalations/run` |
| `tpo.finalizeExternalAcceptances` | every 30 min | 25 min | **Not wired** |
| `tpo.recruiterInviteReminders` | 09:00 daily | 30 min | **Not wired** |
| `tpo.interviewReminders` | 19:00 daily | 30 min | **Not wired** |
| `tpo.interviewMorningReminders` | 08:00 daily | 30 min | **Not wired** |
| `tpo.recruiterMessageEmails` | every 5 min | 4 min | POST `/api/internal/placements/recruiter-message-reminders` |
| `tpo.expireOverdueOffers` | every 15 min | 12 min | POST `/api/internal/placements/tpo/offer-expiry/run` |

Separate due-announcement publisher: every minute, 50-second lease under
`tpo.deliverDueNotices`; its service retains the 30-second Undo hold.

**P0 release gate:** Both "Send now" and "Schedule" on the TPO author form are
disabled until an operator sets `TPO_NOTICE_DELIVERY_VERIFIED=VERIFIED` **and**
`TPO_NOTICE_SCHEDULER_SECRET` is at least 32 bytes. This flag is an operator
attestation, not a CI default. Do not set it until the one-minute CronJob,
registered announcements/audience/notification storage, cross-college recipient
isolation, fresh enrollment, 30-second Undo hold, expiry, rollback/retry and
in-app learner receipt have been exercised in the deployed environment. On
partial fanout failure the worker returns HTTP 503 for scheduler retry/alerting;
it never answers 200 for an incomplete delivery. Old COLLEGE notices without an
audience row are recovered *only* from an authorized creation event explicitly
recording audience=COLLEGE; other missing audience rows fail closed.

**Timing differences:** The legacy fixed-delay intervals start after each
successful run; fixed wall-clock CronJobs run on the minute. Legacy recruiter
digest startup had a 90-second initial delay; a Kubernetes CronJob does **not**
preserve that relative startup warmup. Record and decide this deviation before
claiming strict timing parity.

## Dev manifests staged, not applied

- `deploy/k8s/dev/placement-offer-expiry.yaml`
- `deploy/k8s/dev/placement-withdrawal-escalations.yaml`
- `deploy/k8s/dev/placement-recruiter-message-digests.yaml`
- `deploy/k8s/dev/placement-due-notices.yaml`

All four POST endpoints are authenticated with deployment-managed secrets.
Use `vnext-integrations.TPO_NOTICE_SCHEDULER_SECRET` for TPO notice,
withdrawal and expiry routes (at least 32 UTF-8 bytes).
Recruiter-message digest uses its own
`vnext-integrations.RECRUITER_MESSAGE_WORKER_SECRET` (at least 32 bytes).
The recruiter route additionally enforces same-origin headers; its CronJob
supplies the exact in-cluster Origin.

The expiry worker also needs
`TPO_SCHEDULED_OFFER_EXPIRY_ENABLED=true` and
`TPO_SCHEDULER_ACTOR_USER_ID` set to an **existing**, least-privileged
service actor UUID whose database FK is valid. There is no synthetic actor.
Provider email readiness remains separately governed by the existing
recruiter-message bridge environment checks.

Inspect `GET /api/internal/placements/tpo/scheduler-status` with the
TPO scheduler secret. It reports stored **lease activity only**, not success,
recipient delivery, or healthy provider dispatch. Failures return HTTP 503;
do not interpret empty queues or a held lease as delivery evidence.

## Production release block (P0 — G2-5-032-068)

**NOT PRODUCTION READY.** Do not declare full scheduled-job parity or
promote these dev CronJobs into production until:

1. All ten TPO jobs and notification/cleanup/digest jobs have real, idempotent
   service bindings and approved IST cadence; missing keys must not be marked
   live merely because they are in the registry.
2. Database migration 0133 has been applied; two-worker claim/renew/fence
   races, DB-clock comparison, stale holders and fail-closed outages have
   been verified against disposable PostgreSQL.
3. Tenant recipient filtering, eligibility and opt-outs are checked before
   delivery; provider accept/retry/bounce and suppressions are durable,
   batched, rate-limited and observable without exposing private recipient data.
4. Persistent run history includes last **success**, count, safe error code,
   watermark and retry state. A lease timestamp is not that history.
5. Cluster secret references, actual service URL, service actor, CronJob
   schedule/timeZone support, alerting and full dry-run results are verified.
6. Production deploy/IAM credentials are explicitly provisioned and approved
   by an operator. No deploy was initiated by this lane.

See `docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md` for open rows.
