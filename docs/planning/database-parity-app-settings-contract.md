# DB-033 — active legacy app_setting disposition contract

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Machine-readable registry:** `docs/planning/database-parity-app-setting-disposition.json`  
**Status:** SOURCE_REVIEWED_KNOWN_KEYS / CROSS_DOMAIN_HANDOFF / RUNTIME_NOT_VERIFIED

This task exists to prevent one specific database-parity mistake:
`app_setting` is **not semantically equivalent** to vNext
`module_access_rules`.

The current legacy source uses the same generic table for unrelated concepts:
host/cookie policy, OTP limits, operational batch limits, public client polling
tuning, course completion threshold, placement rate limiting, SMS/DLT config and
optional-module decisions. Only the optional-module subset maps cleanly to
`module_access_rules`.

## Source behavior that makes the table active

`AppSettingsService` reads typed values and supports active/soft-deleted rows,
scope aliases and module fail-closed semantics. `TenantAdminController`
exposes super-admin GET/PUT/DELETE endpoints for GLOBAL, ORGANIZATION and
COLLEGE settings. This is therefore persisted runtime state, not merely a
historical migration artifact.

The same controller deliberately rejects optional-module keys and sends them to
Feature Controls / Module Access. Current source also explicitly retires
`module.courses.enabled` and `module.courses.locked` because Courses is core.

## Reviewed source-active key dispositions

The registry currently covers **25 explicitly evidenced keys**:

- **DB01 — 7:** base/global host, cookie domain/SameSite, OTP attempt/window
  policy and identity JSON-size limit.
- **DB05 — 1:** course watched/completion threshold.
- **DB08 — 1:** placement application rate policy.
- **DB10 — 8:** shared operational batch limits, public client polling/save
  tuning, SMS sender/template/DLT configuration.
- **Existing module_access_rules — 6:** projects, placements and electives
  enabled/locked decisions.
- **Source-retired — 2:** course enabled/locked generic module toggles.

This count is a reviewed-code-key denominator only. It is **not** a claim that a
legacy live database contains only these keys.

## Why module_access_rules is only a partial mapping

`module_access_rules` has typed concepts:

- scope type/id;
- module;
- enabled;
- locked.

That is appropriate for the six source keys represented by Projects,
Placements and Electives enabled/lock decisions.

It cannot safely represent values such as:

- `otp.maxAttempts = 5`;
- `ui.chatPollIntervalMs = 15000`;
- `sms.traiJobUpdateTemplate = "..."`;
- `course.watchedThresholdPercent = 90`.

Encoding these as fake modules or booleans would lose type, validation,
visibility and ownership semantics.

## Cross-domain ownership

### DB01 — identity, tenant and auth security

DB01 must decide canonical persistence versus deployment configuration for:

- `baseDomain`;
- `globalHost`;
- `cookieDomain`;
- `cookieSameSite`;
- `otp.maxAttempts`;
- `otp.windowSeconds`;
- `ops.identityMaxJsonSize`.

Cookie/OTP values are security controls and must never become public client
settings merely because the legacy generic admin API can read them.

### DB05 — course progress policy

`course.watchedThresholdPercent` is consumed by both the signed-in client
settings endpoint and the authoritative learner progress service. One canonical
typed value must feed both so UI optimism and server completion cannot drift.

### DB08 — placement abuse/rate policy

`placement.applyRateLimitPerMinute` is an active global setting in the legacy
job service. The existing legacy limiter itself is process-memory and
replica-local; preserving only the numeric DB value does not preserve the
distributed enforcement behavior. API/RELEASE work must use a shared limiter
or other deterministic distributed mechanism.

### DB10 — shared operational/config state

The reviewed DB10-owned keys are:

- `ops.bulkStatusMax`;
- `ops.progressBulkIdsMax`;
- `ui.chatPollIntervalMs`;
- `ui.progressSaveIntervalMs`;
- `sms.senderId`;
- `sms.traiJobUpdateTemplate`;
- `sms.exotel.jobUpdateDltTemplateId`;
- `sms.exotel.notificationDltTemplateId`.

These still require typed target decisions. SMS provider credentials themselves
are **not** app settings and belong in secret storage. DLT/template identifiers
or non-secret registered content may be runtime configuration only if policy
permits it.

## Public client settings boundary

Legacy `ClientSettingsController` intentionally whitelists exactly three
values rather than returning all app settings:

- `ui.chatPollIntervalMs`, floored to 3000 ms;
- `ui.progressSaveIntervalMs`, floored to 5000 ms;
- `course.watchedThresholdPercent`, default 90.

The source comment explicitly warns that cookie domains, SMS sender IDs and OTP
lockout policy must not reach learner browsers.

Any vNext client-settings API must therefore be registry/whitelist driven. A
generic “return all runtime settings” endpoint is a privacy/security regression.

## Arbitrary-key admin persistence is a redesign decision

Legacy super-admin endpoints accept **arbitrary non-module strings** at GLOBAL,
ORGANIZATION and COLLEGE scopes. That capability means a historical/live
database could contain unknown keys not found by source-code constant review.

vNext is greenfield and requires no historical data migration, so blindly
recreating an unrestricted string K/V table is not justified. The proposed
direction is a typed key registry where every supported key defines:

- owning domain;
- value type and validation/range;
- allowed scopes;
- default;
- whether unset means fallback;
- public/client visibility;
- secret/sensitive classification;
- audit requirements;
- writer permission;
- runtime consumer.

Unknown keys should fail closed instead of becoming silently stored dead
configuration.

DB00/DB19 may still need a metadata-only legacy key census if the team wants to
prove no externally consumed/custom keys exist. That is a source/live-schema
evidence question, not a reason to reintroduce unrestricted persistence.

## Source-retired course toggles

Current `AppSettingsService.isRetiredCourseModuleSetting` explicitly suppresses
reads and rejects writes for:

- `module.courses.enabled`;
- `module.courses.locked`.

The source states Courses is core and should not be recreated as a generic
module toggle. These are **SOURCE_RETIRED** in the registry. Final global
retirement still belongs to the database freeze/audit gate, but vNext should not
stage replacement columns for them.

## Required acceptance — NOT RUN

- **DB33-01:** every registry key is unique.
- **DB33-02:** every key has one owning domain/disposition and typed source
  evidence.
- **DB33-03:** only the six projects/placements/electives enabled/locked keys map
  to `module_access_rules`.
- **DB33-04:** course enabled/locked keys remain source-retired.
- **DB33-05:** DB01 security keys cannot be returned by client settings.
- **DB33-06:** client settings expose only the explicit safe whitelist.
- **DB33-07:** watched-threshold client and server readers resolve one canonical
  value.
- **DB33-08:** SMS/DLT keys never persist provider credentials and never appear
  in public client settings.
- **DB33-09:** invalid typed values fail validation instead of falling through
  to arbitrary strings.
- **DB33-10:** unset/delete semantics restore the documented default rather than
  persisting an empty string.
- **DB33-11:** module enabled/locked writes use dedicated hierarchical module
  authorization and lock semantics.
- **DB33-12:** placement module stays college-level-only and default-off.
- **DB33-13:** unknown/unregistered key writes fail closed in the redesigned
  vNext admin settings surface.
- **DB33-14:** if legacy metadata key census is performed, every additional key
  receives an explicit owner/disposition before DB19 freeze.
- **DB33-15:** typed target schema/config and producer-consumer tests pass after
  domain owners integrate their portion.

These are acceptance requirements, not passing tests.

## Completion boundary

DB-033 can be **COMPLETED, unverified** once the registry, this contract and its
static consistency test are committed and owner handoffs are recorded. It
cannot become DONE_VERIFIED until domain targets and applicable DB33 witnesses
are executed on integrated source.
