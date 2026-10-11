# DB00 Smrithi subsystem peer review — Chat 5

**Date:** 2026-10-11  
**Global phase:** DATABASE  
**Reviewed task:** DB-003, owned by Chat 6. This review does not transfer the claim.  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Decision status:** source evidence strengthened; no queue retirement status changed here.

## Executive finding

The seven pending Smrithi tables are best treated as **one standalone historical admissions/application subsystem**, not seven unrelated LMS tables:

- `smrithi_application`
- `smrithi_college`
- `smrithi_college_keywords`
- `smrithi_education_type`
- `smrithi_notification_template`
- `smrithi_program`
- `smrithi_specialization`

They are physically present in the production-structure snapshot, but current backend/frontend source has no Smrithi files or indexed exact references. The snapshot's own Flyway history shows Smrithi application migrations V53/V54 were applied in April 2026 and then recorded as **DELETE** entries later in April. Those migration files are no longer present on the current `prod-2026` branch. The same production-structure snapshot was subsequently refreshed through V150 on **2026-09-21**, so the Smrithi tables surviving there is evidence of **physical schema residue**, not by itself evidence of a current producer/consumer.

Under the existing vNext program direction—greenfield installation, no historical-data migration, and parity with the **current** LMS runtime rather than preservation of orphaned database artifacts—this evidence strongly supports retiring the Smrithi subsystem **if no detached admissions service remains in product scope**.

## 1. Production-structure snapshot provenance

`src/test/resources/db/README-schema-snapshot.md` explicitly says:

- `mysql-schema-snapshot.sql` is a **structure-only copy of the production schema**;
- it contains 137 tables plus `flyway_schema_history`;
- it contains no application data;
- newer migrations are applied on top during the real-MySQL integration test.

The current snapshot contains 173 Flyway history records and reaches **V150 — assignment upload receipts**, installed on **2026-09-21 08:04:12**.

Therefore the seven Smrithi tables were still physically present in the source schema snapshot as of that refresh.

## 2. Smrithi migration lineage

The snapshot's `flyway_schema_history` contains:

- V53 `V53__smrithi_application_unique_email_phone.sql`, applied 2026-04-03;
- V54 `V54__smrithi_application_soft_delete.sql`, applied 2026-04-03;
- later `DELETE` history entries for V54 on 2026-04-23 and V53 on 2026-04-23.

On the pinned current backend branch, both V53 and V54 files are **NOT_FOUND**. Current GitHub path history lookup for those exact paths also yields no accessible commits, and current code search finds no Smrithi migration/source references.

This does not prove a table DROP. It proves that the current source-controlled migration lineage no longer contains those Smrithi migrations while the physical structure snapshot still retains the resulting tables.

That combination is consistent with an **orphaned/dormant schema family**.

## 3. Current repository producer/consumer evidence

At the pinned current backend tree:

- no path contains `smrithi`;
- exact indexed searches return zero results for all seven table names and generic `smrithi`;
- unique Smrithi fields/constraints such as `pap_reengagement_count`, `job_application_source`, `requires_institution_autocomplete`, `uk_smrithi_template` and `SmrithiApplication` also return zero results.

At the pinned current frontend tree the same searches return zero results.

This is materially stronger than a model-only census: no current named controller/service/repository/model, no indexed native-SQL/table reference, and no frontend consumer was found.

It still cannot rule out an external/detached service outside these repositories.

## 4. Subsystem shape

### Application/account aggregate

`smrithi_application` stores:

- its own `application_id`, application stage/status/source;
- academic and career JSON;
- standalone name/email/phone;
- email/phone verification flags;
- **password_hash**;
- learner linkage only as an optional field;
- PAP re-engagement state;
- review/rejection/resubmission state;
- job source/slug;
- soft delete.

This is not merely a second learner profile table. It is an admissions/application account aggregate with its own authentication/application lifecycle.

**Security implication:** if this subsystem is retired, vNext must not recreate or migrate `password_hash` merely for schema-count parity.

### Admissions taxonomy

`smrithi_college`, keywords, education types, programs and specializations form their own catalog/taxonomy. They are not the canonical LMS `college → department → program → cohort/section` hierarchy.

Mapping them into the core academic schema by table-name similarity would be semantically unsafe.

### Notification templates

`smrithi_notification_template` is a separate template registry with channel/language/version, bodies, provider/DLT IDs, variable schema and actor metadata. Current LMS notification runtime is independently reconciled under DB10. Do not resurrect this historical Smrithi copy unless an active Smrithi producer is proven.

## 4.1 Current configuration residue is unconsumed in source

The frozen backend still contains Smrithi-looking properties such as
`smrithi.master-data.seed-on-startup`, `smrithi.master-data.csv-location`,
`SMRITHI_COLLEGE_NAME`, `SMRITHI_ORG_NAME`, and comments for
`/api/v1/smrithi/context`.

However:

- the configured `classpath:data/smrithi` resource directory is absent;
- exact searches for those property keys, environment variable names,
  `/api/v1/smrithi/context`, and “Vasan Master Data” find no current backend
  or frontend consumer;
- current `application.properties` alone therefore proves stale
  configuration/intention, not an executing subsystem.

## 4.2 Connected 42Students organization-wide detached-service search

Using the connected GitHub organization, repository and code searches for
`smrithi` and `42Learn` returned **zero repository matches and zero indexed
code matches across 42Students**.

This does not rule out a privately deployed service outside the connected
GitHub organization, but it materially narrows the detached-consumer risk:
there is no second connected 42Students repository that currently exposes the
Smrithi implementation.

## 5. Recommended table-level disposition

The seven tables should receive one coherent product decision:

### If standalone Smrithi admissions is **not** part of current LMS/vNext scope

Approve the whole family as:

`RETIRED_APPROVED_GREENFIELD_ORPHANED_SUBSYSTEM`

Rationale:

1. physically retained historical schema is not a migration requirement;
2. vNext has no legacy data migration;
3. current backend/frontend contain no producer/consumer;
4. source-controlled Smrithi migration files are absent;
5. current product parity is with the live LMS behavior, not dormant schema residue;
6. recreating password hashes, duplicate academic taxonomy and duplicate template registries would add risk without a current workflow.

All 91 fields can then close through the subsystem-level retirement decision rather than individual fake mappings.

### If standalone Smrithi admissions **is** still required

Do **not** map these seven tables piecemeal into learner, academics or DB10. Open a dedicated admissions/application persistence domain from the actual current producer/consumer contract, with:

- Identity Platform/current authentication instead of copied `password_hash`;
- canonical tenant/college identifiers;
- explicit application state/history;
- normalized academic/career evidence;
- current notification transport;
- privacy and retention controls.

The historical tables become source reference only.

## 6. Remaining uncertainty

The remaining uncertainty is now narrow:

> Does any detached/external Smrithi admissions application still operate **outside the connected 42Students GitHub organization**, and is it in vNext scope?

No additional in-repository Smrithi producer/consumer ambiguity was found.

This peer review did not run PostgreSQL, Node, browser, or external-service checks and does not mark DB-003 `COMPLETED` or `DONE_VERIFIED`.
