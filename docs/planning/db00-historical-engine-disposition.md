# DB00 historical / engine disposition — greenfield closure

**Owner:** W01 / issue #21  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Source census:** `docs/planning/db-pass4-columns-db00_historical_and_engine.json`  
**Machine ledger:** `docs/planning/db00-historical-engine-disposition.json`

## Decision

| Class | Tables | Fields | W01 disposition |
| --- | ---: | ---: | --- |
| Historical backup/cleanup copies | 31 | 631 | **RETIRE_GREENFIELD_BACKUP** |
| Flyway engine metadata | 1 | 10 | **REPLACED_BY_PLATFORM_MIGRATION_METADATA** |
| Smrithi legacy subsystem | 7 | 91 | **PENDING_PRODUCT_DECISION** |
| **Total** | **39** | **732** | **32/39 table dispositions closed; 7 open** |

This closes table-level disposition for **641 source-derived fields**. It does **not** claim runtime semantic verification.

## Evidence

- The source census already classifies all 31 backup/cleanup candidates as `HISTORICAL_BACKUP_VALIDATE_RETIREMENT`.
- Legacy `V125__drop_legacy_quiz_system.sql` explicitly says the embedded lesson-content quiz system is fully retired in favor of the first-class Quiz/Question/Option/Attempt/Answer model. The dated quiz backup copies do not define active vNext product persistence.
- Legacy `V163__retire_legacy_lesson_content_types.sql` explicitly creates `lesson_contents_legacy_type_backup_v163` as a reversible backup while converting retired content forms to active RESOURCE/LIVE_CLASS behavior.
- `cleanup_*_backup_20260918` and `cleanup_*_ids_20260918` candidates are cleanup snapshots, not independent business aggregates. Greenfield vNext has no historical-data restoration requirement.
- `flyway_schema_history` is migration-tool state. vNext replaces it with the Drizzle journal/snapshot chain.

Retiring a backup never retires the corresponding active user job. The canonical behavior still belongs to its DB01–DB10 domain and needs normal parity proof.

## Seven intentionally unresolved Smrithi tables

- `smrithi_application`
- `smrithi_college`
- `smrithi_college_keywords`
- `smrithi_education_type`
- `smrithi_notification_template`
- `smrithi_program`
- `smrithi_specialization`

The current legacy `prod-2026` source tree contains no Smrithi-named source path, but absence of Java source alone cannot establish whether the persisted subsystem is obsolete, externally consumed, or detached. These seven remain open until explicit producer/consumer or product-retirement evidence is available.

## Guard

`tests/db00-retirement-disposition.test.mjs` cross-checks the ledger against the source census. It is a source-level guard, not PostgreSQL runtime evidence.
