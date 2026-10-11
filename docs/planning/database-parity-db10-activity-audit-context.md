# DB-039 — DB10 admin audit actor and request-context fidelity

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Staging SQL:** `scripts/sql/db10-activity-audit-context-staging.sql`  
**Status:** SOURCE_REVIEWED / STAGED_NOT_REGISTERED / POSTGRES_NOT_RUN

Legacy `admin_audit_log` has 13 persisted fields. Current vNext
`activity_events` already has canonical equivalents for 10 concepts, but loses
three source-active forensic semantics:

1. actor role/type at the time of the action;
2. request IP;
3. request User-Agent.

The current vNext Activity detail page explicitly calls these three out as
DB10 parity gaps.

## Source-active behavior

Pinned legacy `AdminAuditLogService.logRequired(...)` currently:

- resolves authenticated principal user id;
- snapshots `principal.getUserType()`;
- fills organization/college scope from the authenticated principal when caller scope is omitted;
- reads request IP from forwarded/real-IP/remote-address context;
- reads and truncates User-Agent to 512 characters;
- writes structured payload JSON;
- saves and flushes the audit row.

`TenantAdminController` actively writes these audit entries for tenant domain,
branding and app-setting mutations. This is current product behavior, not dead
historical schema.

## 13-field disposition

| Legacy field | Canonical vNext decision |
| --- | --- |
| id | existing `activity_events.id` UUID |
| actor_user_id | existing `activity_events.actor_user_id` |
| actor_user_type | **DB-039** `activity_events.actor_role_snapshot varchar(40)[]` |
| actor_contact_mobile | privacy redesign: resolve canonical `users.phone_e164` through actor user; do not duplicate mobile per event |
| action_key | existing `activity_events.event_type` |
| entity_type | existing `activity_events.subject_type` |
| entity_id | existing `activity_events.subject_id` text |
| organization_id | existing `activity_events.organization_id` |
| college_id | existing `activity_events.college_id` |
| ip_address | **DB-039** `activity_events.request_ip inet` |
| user_agent | **DB-039** `activity_events.user_agent varchar(512)` |
| payload_json | existing `activity_events.metadata` |
| created_at | existing `activity_events.occurred_at timestamptz` |

This preserves all active semantics without cloning the old physical table.

## Why actor role is an array snapshot

Legacy stored one `actor_user_type`. vNext identity can legitimately expose
system roles, active membership roles and recruiter context. Reconstructing
role later from current membership is incorrect because roles can change after
the event.

DB-039 therefore stages a bounded write-time role snapshot rather than a FK to
current role rows. The staged array permits 1–16 values of max 40 characters
each. API code later owns canonical ordering/deduplication.

## Actor phone privacy redesign

Legacy duplicated a mobile number into every audit row. That increases sensitive
data copies and creates stale historical contact values.

vNext already has canonical actor identity through `actor_user_id`. DB-039
intentionally does not add an actor-mobile snapshot. Privileged tooling may
resolve current actor contact through identity data when truly required.

If product later requires historically exact contact-at-action-time, that is a
separate privacy/retention decision and should not be silently added.

## Request IP

`inet` is used instead of an arbitrary varchar so invalid addresses fail
PostgreSQL parsing and IPv4/IPv6 normalize canonically.

The legacy implementation trusted the first `X-Forwarded-For` value. vNext
must improve this: only framework/reverse-proxy trusted provenance may supply
the effective client address. Browser JSON or an untrusted forwarded header is
never authority.

Request IP is forensic data and must not be copied into general
`activity_events.metadata`.

## User-Agent

User-Agent remains optional and bounded at 512 characters, matching the active
legacy limit. Empty strings are rejected when supplied.

Like request IP, it is privileged forensic context. Ordinary activity feed
queries do not need to return it.

## Structured payload

Legacy `payload_json` maps to existing `activity_events.metadata`, which is
already bounded/redacted before Activity detail rendering. Request context must
stay out of producer-supplied metadata so callers cannot spoof forensic fields.

## Tenant scope

Existing `activity_events.organization_id` / `college_id` remain the tenant
scope. DB-039 does not introduce duplicate organization/college references.

Any API writer that captures forensic request context must still use normal
activity scope/permission checks. Request IP/User-Agent never grant authority.

## Query/index decision

Legacy indexed actor user + actor type. Current vNext already indexes actor
user. DB-039 adds a partial GIN index on role snapshots for future privileged
role filtering without recreating a role table.

No IP/User-Agent index is staged: ordinary product queries should not search
these high-cardinality/privacy-sensitive fields by default.

## Retention and access boundary

The SQL stages storage shape but does not invent a retention duration.

Before activation, the integrated product must define:

- which administrator roles may read request IP/User-Agent;
- whether college admins may see them or only global/super admins;
- retention/purge duration;
- export/redaction behavior;
- whether security incident preservation overrides normal retention.

Until that policy exists, runtime producer cutover remains unverified.

## API-phase handoff

Later API work must add trusted request-audit context to the activity writer.
Current `RequestContext` only contains authenticated identity/scope and does
not carry network headers.

The API implementation must:

1. derive roles from authenticated `RequestContext`, never request JSON;
2. derive client IP from trusted server/proxy context;
3. truncate/canonicalize User-Agent server-side;
4. write all three fields atomically with the activity event;
5. keep them out of normal feed payloads unless explicitly authorized;
6. preserve nulls for background/system events with no HTTP request.

## Acceptance requirements — ALL NOT_RUN

- **DB39-01:** numbered migration adds exactly the three staged forensic fields.
- **DB39-02:** actor role snapshot accepts bounded valid arrays and rejects null elements / >16 roles.
- **DB39-03:** invalid request IP text fails PostgreSQL `inet` parsing.
- **DB39-04:** IPv4 and IPv6 round-trip canonically.
- **DB39-05:** User-Agent over 512 chars is truncated before write or rejected by producer validation.
- **DB39-06:** blank persisted User-Agent is rejected.
- **DB39-07:** actor mobile is not duplicated into activity events.
- **DB39-08:** historical role snapshot remains unchanged after actor roles change.
- **DB39-09:** browser-supplied spoofed role/IP/User-Agent fields cannot override server-derived values.
- **DB39-10:** untrusted `X-Forwarded-For` cannot spoof stored client IP.
- **DB39-11:** tenant scope still derives from existing activity authorization and cannot be forged through request context.
- **DB39-12:** request IP/User-Agent are omitted from ordinary activity list payloads.
- **DB39-13:** privileged detail access follows approved request-context disclosure policy.
- **DB39-14:** payload metadata redaction continues to protect secret keys independently of new forensic columns.
- **DB39-15:** direct SQL insert with malformed role snapshot fails the staged check.
- **DB39-16:** migration replay + schema snapshot/catalog drift pass after Chat 1 integration.
- **DB39-17:** retention/purge behavior is explicitly approved and tested before production enablement.
- **DB39-18:** all 13 legacy admin-audit fields have a final DB19 disposition with zero silent drops.

## Completion boundary

DB-039 may be **COMPLETED, unverified** after staging SQL, exact field mapping,
static guards and DB10 ledger reconciliation are committed.

It is not DONE_VERIFIED until the forward migration is registered, PostgreSQL
witnesses run, API capture is implemented from trusted server context, and
privacy/retention policy is approved.
