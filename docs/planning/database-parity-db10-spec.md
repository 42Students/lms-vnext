# DB10 Shared Operations — independent implementation and parity handoff

**Claim:** [GitHub issue #12](https://github.com/42Students/lms-vnext/issues/12). **Branch:** `db10-shared-operations-2026` based on `db-parity-2026`.  
**Legacy backend oracle:** `lms/prod-2026@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`; **frontend:** `lms2-fe/prod-2026@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.  
**Provisional vNext baseline:** `main@5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a`. Refresh all heads and record changed files before final parity sign-off.

## Why this stream is separate

Active parallel owners: DB03 Groups/Electives; DB04 Profiles & Verification; DB08 Placement Policy & Outcomes; DB09 TPO/Recruiter Operations. **This chat owns DB10 Shared Operations only.** DB09 work initiated on an overlapping branch was explicitly retired; its draft PR #10 is closed without deleting history. Shared migration journal, placement DB schemas, DB03 and DB04 tables, and identity authorization are excluded from concurrent DB10 edits.

**Greenfield:** no old production data import. Match active user-visible rules and persistence contracts; allow PostgreSQL/Drizzle normalization, but explicitly account for all active concepts. Source inventory is **not** a reconstructed live database.

## Baseline and evidence scope

`docs/planning/db-pass4-columns-db10_shared_operations.json` lists **19 source table candidates and 221 candidate columns** (only 15 same-name candidate columns). Every field is tracked, initially `UNMAPPED`, in `database-parity-db10-field-ledger.json`. This count is a source-derived hypothesis; all 221 require semantics, producers and consumers, tenant policy and DB/runtime tests. Candidate target table-name matches are not proof.

**Source DDL inspected:** legacy `V151__bug_tracker_phase1.sql`, `V152__bug_tracker_attachments.sql`, `V153__bug_tracker_workflow.sql`, `V154__bug_tracker_source_context.sql`, `V157__log_alerting.sql`. Before closure also review DDL changes `V158`, `V164`, historical notification/template and skill code and `V194` renames. Never re-use the old manually provisioned tracker access hashes as live credentials.

**vNext code inspected:** `src/db/schema/activity.ts` defines `activity_events` and `in_app_notifications`; `src/modules/activity/{service,notification-service}.ts` implements event recording, notification insertion, self-scoped reads and marking read. Audit event records lack some old `admin_audit_log` provenance fields such as IP and user-agent. One-to-many announcements and delayed delivery are not semantically equivalent to immediate notifications.

## Complete 19-table source queue

| # | Legacy table | Source fields | Name-only possible target | Contract to reconcile | Status |
|---:|---|---:|---|---|---|
| 1 | `admin_audit_log` | 13 | `activity_events` | Privileged admin action evidence, actor/contact, IP and user-agent; sensitive retention | UNVERIFIED |
| 2 | `announcements` | 13 | `in_app_notifications` | Role/recipient announcements with schedule, expiry, pinning and soft delete | UNVERIFIED |
| 3 | `app_setting` | 9 | `module_access_rules` | Scoped runtime settings (not automatically equivalent to module access rules) | UNVERIFIED |
| 4 | `bug_report` | 31 | No candidate | Bug intake, source context, assignee workflow, versioned status, fix/retest/production verification | UNVERIFIED |
| 5 | `bug_report_activity` | 8 | No candidate | Immutable issue lifecycle changes and human-readable audit | UNVERIFIED |
| 6 | `bug_report_attachment` | 7 | No candidate | Private attachment metadata and secure object references | UNVERIFIED |
| 7 | `bug_tracker_access` | 7 | No candidate | Separate tracker access profiles and token hashes; retire or redesign only with user approval | UNVERIFIED |
| 8 | `bug_tracker_session` | 5 | No candidate | Tracker sessions, hashed tokens, expiry and revocation | UNVERIFIED |
| 9 | `lms_notification_template` | 28 | No candidate | Versioned per-channel LMS templates, DLT identifiers and variable schema | UNVERIFIED |
| 10 | `log_alert_signature` | 17 | No candidate | Deduplicated error fingerprints, suppression/mute, regressions and fix evidence | UNVERIFIED |
| 11 | `log_alert_signature_account` | 3 | No candidate | Cross-account fingerprint occurrence linked to signature | UNVERIFIED |
| 12 | `log_alert_state` | 4 | No candidate | Poll cursor, last-viewed state and safe recovery after restart | UNVERIFIED |
| 13 | `notification` | 21 | `in_app_notifications` | Legacy learner/faculty notification delivery, scheduling, state and idempotency | UNVERIFIED |
| 14 | `notification_template` | 28 | No candidate | Versioned cross-channel templates; verify relationship to LMS-specific template | UNVERIFIED |
| 15 | `scheduled_job_lock` | 4 | No candidate | Lease/fencing for scheduled execution; prevent duplicate workers | UNVERIFIED |
| 16 | `skill_synonyms` | 3 | No candidate | Canonical skill aliases and search matching | UNVERIFIED |
| 17 | `skill_usage` | 3 | No candidate | Per-skill usage metrics and last-used history | UNVERIFIED |
| 18 | `skills` | 9 | No candidate | Taxonomy, active/search priority, aliases and analytics | UNVERIFIED |
| 19 | `sms_delivery_log` | 8 | No candidate | SMS transport outcome, provider message IDs and minimized recipient data | UNVERIFIED |

### DB10-N: first implementation increment — existing notification correctness

**Three confirmed source-code defects** in `src/modules/activity/notification-service.ts` were changed here (no schema migrations):
1. `countOwnUnreadNotifications` previously listed at most 100 unread rows and returned array length. Now uses `count()` with both recipient ownership and `read_at is null` conditions.
2. `deliverInAppNotification` previously returned number of active recipients regardless of `onConflictDoNothing()`, reporting duplicates as delivered. Now uses `returning({id})`, accurately reports inserted count and adds `skippedDuplicate`. Inactive users remain counted separately.
3. `actionHref` previously accepted `//other-host` and backslash/control-character sequences. Now requires safe internal paths and rejects protocol-relative URLs. **Stored-row defense:** `listOwnNotifications` now suppresses unsafe legacy action links on read via `safeNotificationActionHref`; existing database bytes remain unchanged for auditability. Any alternate notification read consumer must reuse this policy.

**New executable tests** at `tests/integration/db10-notification-guards.test.ts`: duplicate-event count semantics, 105 unread notifications (including cross-user isolation and decrement on read), off-origin/control-character URL rejection, and existing unsafe-row read sanitization. `tests/unit/notification-action.test.ts` tests the pure path policy. **Not executed yet** until a disposable PostgreSQL with committed migrations and seed is available. A separate Node-based tracker test `tests/db-parity-db10-ledger.test.mjs` guards source-record completeness and prevents fake verification. No test claim without actual runner output.

### Critical privacy and lifecycle gates still open

- **Announcement model:** recipients, scheduling/expiry/pinning/deletion and absence of cross-college broadcasts.
- **Bug tracker:** internal/guest access vs platform accounts, reporter/manager powers, hashed session tokens, route/source details, attachments, explicit workflow transitions, optimistic versioning, immutable activity, deploy SHA and regression/retest states. V151 seeded hashes are legacy data and must not become new production secrets.
- **Audit records:** distinguish immutable security/audit events from grouped activity feed; actor, tenant, IP/UA and PII retention/deletion policy.
- **Templates/transport:** template versioning, DLT references, variable injection escaping, outbox idempotency and backoff, suppressed recipients, SMS provider message IDs, PII minimization and deliver-once semantics.
- **Error alerts:** signature hash scoping (environment/account), known-vs-regression transitions, retention, muted-signature behavior, durable scan cursor.
- **Skills:** active taxonomy, synonyms, usage aggregation and cross-role search parity.
- **Scheduled job lock:** lease acquisition, heartbeat, fencing or execution attempt identity, crashed worker takeovers and clock assumptions.

## Ordered, conflict-free execution batches

| ID | Task | Acceptance standard | Progress |
|---|---|---|---|
| DB10-N0 | Fix existing notification count, duplicates and link validation | Source changed; tests authored; database verification pending | IMPLEMENTED_NOT_VERIFIED |
| DB10-N1 | Read-side link policy and tests | Policy wired to reads/writes; DB tests and all read-path consumer audits pending | IMPLEMENTED_NOT_VERIFIED |
| DB10-N2 | Delayed delivery, expiry, announcement targeting | Scheduling, expiry and deletion remain faithful to legacy workflows | NOT_STARTED |
| DB10-B1 | Bug tracker exact API, roles, fields and state map | 5 legacy tables / all fields mapped with transitions, tenant and audit evidence | NOT_STARTED |
| DB10-A1 | Audit and announcements domain | Separate security audit from activity; schedule/targeting/pin/expiry | NOT_STARTED |
| DB10-T1 | Templates, notifications, SMS and durable delivery | Versioning, DLT, suppression, retries, dedupe, multi-provider outcomes | NOT_STARTED |
| DB10-L1 | Log alerting + scheduled job lease | Safe restart, muting, reacquire race/fencing | NOT_STARTED |
| DB10-S1 | Skills and synonym resolution | Aliases, deactivation and usage concurrency | NOT_STARTED |
| DB10-FINAL | Exact 221-field crosswalk, source refresh, disposable PostgreSQL and producer/consumer UI verification | 221/221 evidenced or explicitly approved retirement, tests green | NOT_STARTED |

## Concrete regression/security tests to add

DB10-01: 105 unread notifications returns 105; marking one read yields 104, another user remains zero.  
DB10-02: duplicate delivery is idempotent and reports `delivered=0` rather than claiming 1.  
DB10-03: path `//evil`, backslash, control characters are refused; stored old unsafe paths cannot navigate after read.  
DB10-04: unauthorized read/write/notification receipt across user/college boundaries is denied.  
DB10-05: announcement scheduled in future or expired never appears as a delivered notification.  
DB10-06: two admins racing on `bug_report.version` cannot silently lose a status or fix-note update.  
DB10-07: reporter cannot set production_verified or mark regression test passed.  
DB10-08: attachment paths are private and only authorized report viewers can open them.  
DB10-09: revoked tracker session and reused token are denied; no credentials in logs.  
DB10-10: SMS retries do not duplicate user-visible sends; bounced/suppressed recipients are skipped.  
DB10-11: missing DLT template or invalid substituted variable prevents unsafe outbound send.  
DB10-12: two workers competing for one lease produce one leader; stale lease holder is fenced.  
DB10-13: alert fingerprint recurrence and post-fix regression are distinguished after restart.  
DB10-14: skill synonym collisions and retired skill IDs do not corrupt matching.  
DB10-15: semantic drift across legacy source SHAs marks affected records STALE.

## Definition of verified

Each field must contain `legacy table.column`, meaning/source code SHA, vNext target or approved redesign/retirement, nullability/default/precision/timezone, keys/FKs, deletion semantics, tenant and actor, producer/consumer, invariant and observed DB/test/UI evidence. `UNMAPPED`, `IMPLEMENTED`, `BLOCKED` and unexecuted tests are **not** verification.

**Current database semantic closure: 0/221.** The three notification fixes are useful behavior hardening, not completed legacy database parity. Merge DB10 only after source refresh, CI/typecheck, disposable PostgreSQL tests and a conflict review against moving `db-parity-2026`; never force-push.
