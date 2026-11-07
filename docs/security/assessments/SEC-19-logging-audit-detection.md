# SEC-19 security logging, audit trails and detection: assessment (2026-11-08)

Method: code read and dev checks (the audit trail was exercised on dev: login, denied request, rejected login produced rows; the runtime role was refused UPDATE, DELETE and TRUNCATE). Nothing VERIFIED.

| Control | What exists | Proposed state |
|---|---|---|
| 001 event schema | `security_audit_events`: time, request id, event, outcome, actor user, membership, college, role, method, path, status, target, one-way IP tag, JSON detail (bounded 4 KB) | IMPLEMENTED_UNVERIFIED |
| 002 authentications | `auth.login_started`, `auth.login_succeeded`, `auth.login_rejected` (with error code) in the table and the log; no contacts or codes | IMPLEMENTED_UNVERIFIED |
| 003 MFA and recovery | No MFA enrolment exists (OTP only); recovery is the same OTP flow; Super Admin second code is part of login | GAP until MFA is built |
| 004, 005, 007 permission, privileged and membership changes | Every mutating request through `route()` is written as `api.mutation` with the path, actor, college, role and status; guarded server actions as `action.<name>`; workspace switches are `POST /api/auth/memberships` (also an `api.mutation`). Role and membership changes are therefore recorded by path, but not as typed before/after events | PARTIAL: add typed events carrying old and new role |
| 006 exports | `api.export` for every download response, step-up required before it | IMPLEMENTED_UNVERIFIED |
| 008 blocked cross-tenant attempts | 401, 403 and 429 are `api.denied` rows. Another college's rows are invisible under RLS, so a foreign id answers 404, which is counted per user by the `object_enumeration` tripwire (30 in 5 minutes) but not stored per request | PARTIAL |
| 009 configuration changes | Super Admin scope entered and cleared (`admin_scope.*`); other settings changes are mutating routes (`api.mutation`) | PARTIAL |
| 010 audit apart from debug logs | Separate table and separate structured events (`api.audit`, `action.audit`, `admin_scope.audit`, `auth.*`, `internal.route_denied`) | IMPLEMENTED_UNVERIFIED |
| 011 tamper protection | Trigger refuses UPDATE, DELETE and TRUNCATE for every role; the runtime role holds only INSERT and SELECT; the table is owned by the migration login, which the application never uses; verified on dev | IMPLEMENTED_UNVERIFIED (CI acceptance covers the trigger) |
| 012 central collection | Container stdout goes to Cloud Logging (retention by project settings, not read here); the table is central per environment | PARTIAL |
| 013 time and correlation | Database clock (`now()`), `x-request-id` on every response and in every row | IMPLEMENTED_UNVERIFIED |
| 014 to 018 detection | In-process tripwire (`src/security/anomaly.ts`): 20 denials per user in 5 minutes, 10 rejected logins per client tag in 5 minutes, 30 not-found answers per user in 5 minutes, 10 exports per user in 10 minutes; each finding is a `security.anomaly` WARNING and a row. Not covered: impossible travel, new Super Admin devices, secret misuse, service-to-service access. Counters are per instance and reset on restart | PARTIAL |
| 019, 020 severity, on-call, alert delivery | Telegram alerting exists for application errors (`log-alerts`); `security.anomaly` findings are now ERROR logs and so also reach the Telegram alert module (deduplicated there); no on-call rota, no alert delivery test | PARTIAL (owner for the rota and the delivery test) |
| 021 retention and minimisation | Proposal: 400 days online then cold storage; rows hold no contacts, codes, tokens or request bodies; no deletion job (append-only table) | OWNER decision |
