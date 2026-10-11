# DB-037 — duplicate legacy notification-template registries

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Field disposition:** `docs/planning/database-parity-db10-notification-template-disposition.json`  
**Status:** ALL_56_SOURCE_DISPOSITIONED / FINAL_RETIREMENT_PROOF_PENDING / RUNTIME_NOT_VERIFIED

DB10's source ledger contains two structurally identical 28-field families:
`notification_template` and `lms_notification_template`. The original DB10
review treated their absence in vNext as a missing template-registry gap.

Current pinned runtime evidence shows a different answer: **the database tables
are not the current notification source of truth**.

## Current executable oracle

The pinned legacy `NotificationEventRegistry` explicitly describes itself as
in-code notification configuration and states **"No DB or CSV."**

The current dispatcher:

1. selects event/channel behavior from `NotificationEventRegistry`;
2. renders IN_APP subject/body from the registry through
   `NotificationTemplateRenderer`;
3. resolves EMAIL provider template IDs through
   `ZeptoMailTemplateIdResolver` from `zepto.template.<templateKey>`
   application/environment configuration;
4. routes SMS through `SmsService`, whose current provider implementations use
   DLT/provider configuration rather than the template tables.

The repository still contains `notification_templates.csv`, but the current
registry explicitly says CSV is not the dispatch source. Repository presence is
not runtime persistence evidence.

vNext likewise has registered `activity_events` and `in_app_notifications`
but no generic persisted template registry.

## Decision

**Do not create a generic vNext notification-template table merely to mirror the
historical 28-column physical shape.**

Preserve the active semantics where the current product actually owns them:

- typed event/channel/content registry in application code;
- provider template IDs in typed provider configuration;
- SMS/DLT identifiers/content in the DB10 provider/runtime configuration
  contract from DB-033;
- merge-variable validation/schema in typed code;
- rendered user notifications as delivery/event rows, not reusable template
  rows.

Both historical table families receive the same semantic disposition because
their 28 reviewed columns are identical.

This is a **source-backed redesign/retirement candidate**, not final retirement
approval. DB00/DB19 must still prove there is no native-SQL, detached service,
external sync or other current consumer before the 56 rows may be marked
`RETIRED`/verified.

## 56-field disposition summary

The machine-readable file contains exactly 56 records: 28 from each table.

| Disposition | Fields | Meaning |
| --- | ---: | --- |
| SOURCE_RETIRED_PERSISTENCE_METADATA_PENDING_GLOBAL_PROOF | 20 | row IDs, creation/update actors/times, active/default/deleted/sample/version state exist only because a DB registry row existed; no current runtime registry producer/consumer was found |
| REDESIGNED_TO_TYPED_CODE_REGISTRY | 10 | template key, notification type, channel, action/icon semantics belong to typed event routing/code |
| REDESIGNED_CHANNEL_SPECIFIC | 8 | subject/body/html/language are owned by in-app code or external provider templates depending on channel |
| REDESIGNED_TO_CODE_SCHEMA_OR_DOCUMENTATION | 8 | variable schema, merge mappings, examples and descriptions belong to typed validators/docs rather than generic DB JSON |
| REDESIGNED_TO_SMS_DLT_CONFIGURATION | 8 | DLT entity/template/compliance/format state belongs to typed SMS provider config |
| REDESIGNED_TO_PROVIDER_CONFIGURATION | 2 | external email template identifiers belong to provider configuration |

Counts above include both identical legacy tables.

## Important field decisions

### template_key / notification_type / channel

Current runtime models notification event identity and enabled channels in code.
These fields therefore map to a typed event registry, not arbitrary editable DB
strings.

An eventual product feature for runtime-editable templates would be a **new
feature** and needs its own authorization/versioning/preview/audit design. It
must not be smuggled into clone parity by reviving unused persistence.

### subject / body / html_body

There is no one universal target:

- IN_APP content is typed application content;
- EMAIL body/HTML is provider-managed when using provider template IDs;
- SMS body must match DLT/provider policy and cannot be arbitrary tenant text.

A single generic persisted body field would blur those security and compliance
boundaries.

### external_template_id

Current legacy resolves ZeptoMail IDs from application/environment properties.
vNext should use typed provider configuration. Provider credentials themselves
must stay in secret storage.

### DLT fields

`dlt_entity_id`, `dlt_template_id`, `is_dlt_compliant` and
`sms_variable_format` are active *concepts*, but their current runtime owner is
the SMS provider/config layer. DB-033 already routes current SMS/DLT settings to
DB10 runtime configuration.

Do not recreate a parallel DLT copy inside a generic notification-template row.

### variable_schema / merge_variable_mapping / example_data

These fields represent useful validation/documentation concepts. Current runtime
has typed event variables, merge maps and validators in code. vNext should keep
them compile-time/type-safe unless runtime editing is explicitly introduced.

### row metadata fields

IDs, version, default/sample/active/deleted flags and row-level created/updated
audit fields have no independently active semantic once the template row itself
is not a runtime source. They are therefore **source-retired persistence
metadata pending global proof**, not targets for replacement columns.

## Why two tables do not become two vNext tables

The DB10 ledger proves both legacy families have the same 28 reviewed columns.
No current runtime source path reviewed here distinguishes one as the active
registry.

Creating two replacement tables would therefore duplicate a historical storage
shape with no executable semantic justification.

## Runtime safety requirements

Even without a template table, notification parity still requires:

- every current event has a typed, reviewed channel policy;
- every IN_APP producer supplies bounded title/body/actionHref;
- action paths are internal/sanitized;
- email send skips/fails closed when provider template ID is absent;
- SMS send fails closed when DLT/provider configuration is absent;
- provider acceptance is not misreported as delivery;
- secret provider credentials never enter template/config rows or user-visible
  diagnostics;
- merge variables are bounded and validated;
- notification event changes are code-reviewed/tested unless a future
  authorized runtime editor is intentionally designed.

## Acceptance requirements — NOT RUN

- **DB37-01:** field-disposition file contains exactly 56 records.
- **DB37-02:** each legacy table contributes exactly the same 28 unique columns.
- **DB37-03:** both table column sets are identical.
- **DB37-04:** all 56 fields have one explicit source disposition and canonical target/reason.
- **DB37-05:** no field is marked runtime-verified or final-retirement-approved.
- **DB37-06:** template_key/notification_type/channel route to a typed code registry.
- **DB37-07:** email external template IDs route to provider configuration.
- **DB37-08:** DLT fields route to SMS/DLT configuration and never provider secrets.
- **DB37-09:** subject/body/html are channel-specific rather than one generic editable DB source.
- **DB37-10:** variable schema/mapping/example data route to typed validation/docs.
- **DB37-11:** historical row metadata is not recreated merely for physical parity.
- **DB37-12:** current IN_APP delivery remains persisted in delivery/event tables, not template rows.
- **DB37-13:** missing email provider template configuration fails closed.
- **DB37-14:** missing SMS/DLT configuration fails closed.
- **DB37-15:** no current reviewed Java dispatcher/service/repository path reads or writes either template table.
- **DB37-16:** DB00 native-SQL/detached-consumer sweep finds no current producer/consumer.
- **DB37-17:** read-only live schema evidence, if available, is treated as existence evidence only, not active-use proof.
- **DB37-18:** DB19 final freeze approves REDESIGNED/RETIRED status for all 56 rows before DATABASE certification.

## Relationship to other Chat 5 work

- **DB-024:** durable TPO notification/outbox/undo/digest persistence.
- **DB-031:** immutable privacy-safe SMS provider attempt ledger.
- **DB-033:** typed disposition of active app_setting keys, including SMS/DLT configuration.
- **DB-037:** removes the false requirement to recreate a generic historical template registry.

These are complementary layers. None is permission to claim external delivery
or to expose provider secrets.

## Completion boundary

DB-037 may be **COMPLETED, unverified** after all 56 source fields are
dispositioned, the DB10 ledger is updated to reflect the source decision, static
guards are authored, and owner handoffs are recorded.

It cannot be DONE_VERIFIED until DB37-15..18 are satisfied with global
producer/consumer/live-schema evidence and DB19 approves the final disposition.

## Implementation-evidence distinction — follow-up DB-037 hardening

The **56 source-dispositioned fields are not 56 implemented vNext fields**. The separate field ledger now records `targetImplementationStatus` for every historical field:

- **36** channel/event/content/DLT/provider target concepts: `SOURCE_DESIGN_ONLY_VNEXT_PRODUCER_CONSUMER_NOT_PROVEN`.
- **20** historical row metadata candidates: `NOT_APPLICABLE_SOURCE_RETIREMENT_PENDING`.
- **0** runtime workflow-verified fields; **0** globally approved retirement fields.

The vNext `notification-service.ts` is a recipient delivery service, not a registered typed event-to-template renderer. The `outbound-delivery-queue.ts` stage has an explicit runtime-disable gate until independent DB10 activation. Neither can be cited as proof that legacy event text or external channel behavior has been fully replaced.

The pinned legacy `NotificationEventRegistry` has an especially important **negative channel rule**: offer/hired/cancelled/rescheduled events are in-app only pending missing email/SMS templates; `SYSTEM_OTP_SMS` bypasses the generic dispatcher. That behavior must be explicit in the later API channel contract. Imported historical CSV/table rows cannot silently enable extra notification channels.

Source guard tests include a 56-row ledger sync check and a fail-closed check that no row can claim vNext runtime parity from source disposition alone. Those are **authored Node tests**, not recorded execution. This task remains eligible for source-implementation `COMPLETED`, but not `DONE_VERIFIED`.
