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


## 2026-10-11 DB-003 Smrithi evidence sweep (source-only)

**Machine-level 91-column evidence:** [db00-smrithi-source-evidence.json](db00-smrithi-source-evidence.json). Each of the seven tables now has its complete checked-in snapshot column definitions, source risk flags, declared keys/FKs/indexes, high-priority semantic fields, and a concrete verification checklist. The existing 32 decided historical/tool rows and the 7 **PENDING_PRODUCT_DECISION** rows are unchanged. This is **not** a DB run, external-consumer search, permission to retire, or finished DB00 reconciliation.

The MySQL file `src/test/resources/db/mysql-schema-snapshot.sql` is a checked-in **test snapshot reportedly through V150 (approximately 2026-09-21)**, not proof of the live database at the 2026-10-07 backend oracle. Later migrations (V151–V194), Hibernate/native SQL or another deployed client may change actual persistence. The pinned JPA entity census covers 118 model Java sources and has **no Smrithi-named entity**, and GitHub's indexed search for `smrithi` returned no result; neither fact excludes external writers/readers or non-indexed references.

| Table | Source fields | Key unresolved product/data invariant |
| --- | ---: | --- |
| `smrithi_application` | 28 | Candidate/application account state, password hash, verified email/phone, academic/career JSON, unique application ID/email/phone; confirm auth and recruitment consumer ownership |
| `smrithi_college` | 7 | Independent college-name catalog and lifecycle; separate from LMS college identity unless proven equivalent |
| `smrithi_college_keywords` | 2 | Autocomplete keywords with a **declared FK** to Smrithi college; retire together only |
| `smrithi_education_type` | 9 | Form-type, order, activation and institution autocomplete behavior |
| `smrithi_notification_template` | 28 | Composite unique `(template_key, channel, language, version)`, DLT/template IDs, merge schemas; compare outbound service before any consolidation |
| `smrithi_program` | 9 | Unique `(name, education_type)`; `education_type_id` has **no declared FK** in this snapshot |
| `smrithi_specialization` | 8 | `program_id` has **no declared FK** in this snapshot; validate intended referential semantics if retained |

**Decision gate:** Establish live database/table presence and producer/consumer ownership (including other services and web/mobile clients); inspect V151–V194 and native queries; then obtain an explicit product decision: retain with a complete mapped/DB-tested contract, or retire with signed-off no-consumer evidence. Because `smrithi_application` contains personal and credential-like fields, never copy customer data or treat absence of a Java entity as proof of safe deletion.

**New regression guard:** `tests/db00-retirement-disposition.test.mjs` now compares all 91 fields and historical SQL constraints with the evidence file, and refuses to treat undecided rows as safely retired. Authored test only; no claim that CI, disposable PostgreSQL or a live consumer investigation has passed.
