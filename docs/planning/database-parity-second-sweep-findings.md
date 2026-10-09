# Database parity — second adversarial completeness sweep

**Run date:** 2026-10-09 (IST)  
**Legacy backend pinned SHA:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (`prod-2026`)  
**vNext original schema SHA:** `5ca60b0f39a25c7b8dc1d0e26f4bbdfe8e5ec15a` (84 tables, 837 columns in Drizzle snapshot)  
**Current frontend head observed:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` (UI oracle drift to be reviewed separately).

## What the first pass had missed

The first pass mainly inspected 8 newer migrations (45 CREATE TABLE declarations, 469 column candidates) and JPA model candidates (118). **This was NOT a complete legacy schema inventory.**

This sweep found:

| Item | Source result | Important limitation |
| --- | ---: | --- |
| Checked-in test MySQL schema snapshot through roughly V150 | **137 tables, 2,138 original CREATE TABLE columns** | Not the current live database, from approximately 2026-09-21 |
| All V151–V194 Flyway SQL files | **44/44 inspected** | Migration text, not actual application success |
| CREATE TABLE statements added by those migrations | **62** | Includes historical one-off backup |
| Distinct table candidates after the 7 V193 table renames | **199** | **Not** 199 active production features or required vNext tables |
| Initial created-column candidates across the candidate tables | **2,744** | Not the fully resolved modern physical field set |
| Additional ALTER ADD COLUMN candidates in V151–V194 | **85** | Some columns subsequently renamed; extra changes via dynamic SQL may be missed |
| ALTER RENAME COLUMN source candidates | **13** | Explicit mapping required; V193 uses multiple renames |
| Historical backups requiring keep/retire review | **31** | Not automatically product dependencies |
| `smrithi_*` legacy tables | **7** | Product purpose/retirement not established |
| Prior initial table crosswalk entries | **46** | Candidate mapping only; not verified |
| Previously untracked reconstructed table candidates | **153** | All now queued for explicit review |
| Tables left without an audit domain | **0** | Grouping is not proof of business coverage |

**Source inventory:** `database-parity-expanded-legacy-registry.json` (199 table entries, source field data), `database-parity-full-domain-queue.json` (199 assigned domain rows), `db-sweep-migrations-{151-161,162-172,173-183,184-194}.json`.

## Newly identified categories omitted from the original gap list

1. **Legacy physical schema baseline** (F11, critical): 137 tables/2,138 fields in `src/test/resources/db/mysql-schema-snapshot.sql` had not been counted in the primary mapping. This includes many academic, course, faculty, user, assessments, projects, notifications and administrative tables, even when vNext has differently named counterparts. All remain NOT_AUDITED.
2. **Post-snapshot schema evolution** (F12, critical): 44 later migrations add 62 tables, change many existing tables, and introduce state histories, new fields and privacy/placement policies. Counting only 8 hotspots silently missed schema changes to `job`, `learner`, `faculty`, `project_sprint`, `class_schedule`, `job_application`, etc.
3. **Recruiter rename / no double counting** (F13, high): `V193__recruiter_naming.sql` renames **7 tables**, **13 columns** and stored enum-like codes from HR/LEAD to RECRUITER. `V194` rebuilds FKs under new names. Target model must follow current identities; a pre-V193 `hr_user` table is **not** an additional current table. `database-parity-expanded-legacy-registry.json` captures old and new names.
4. **Dynamic, conditional DDL** (F14, high): legacy `V125__drop_legacy_quiz_system.sql` uses a stored procedure that conditionally DROPs columns not necessarily present in Flyway-created tables, explicitly attributing columns to Hibernate `ddl-auto=update`. A simple SQL regex parser or raw migration table diff misses these. This is direct evidence the legacy JPA/Flyway dual writer must not be treated as a complete current physical schema. Explicit DROP TABLE `quiz_draft` is documented; avoid recreating retired embedded-quiz behavior as active.
5. **Triggers and operational DB behavior** (F15, high): `V113__fix_company_dedup_key_insert_trigger.sql` explicitly fixes a BEFORE INSERT trigger, while its BEFORE UPDATE twin remains. Recreate the **deduplication invariant**, not necessarily MySQL trigger code. Read-only introspection must capture triggers, routines, views and events.
6. **Unresolved academic/assessment data** (F16, high): `new_program`, `new_program_structure`, `program`, `program_structure`, `semester`, `semester_course`, `lecture_hall`, `class_schedule`, `faculty_course_*`, legacy exam/quiz/attempt variants and grade audit must each map or be explicitly retired. Their historical physical presence alone does not prove active use.
7. **Unresolved shared/ops data** (F17, high): `admin_audit_log`, `app_setting`, `grade_audit_log`, `notification`, `lms_notification_template`, `notification_template`, `sms_delivery_log`, `scheduled_job_lock`, `log_alert_*`, `bug_report_*`, skill records, account OTP/login/refresh and recruiter/TPO-specific audit and bell/read views need product/ops decisions.
8. **Snapshot backs up obsolete history** (F18, medium): **31** backup tables and **7** Smrithi tables are discovery candidates, not automatic requirements in clean vNext. Also `flyway_schema_history` is deployment metadata, not a business table. Do not build 199 vNext tables to match a 199-item registry.
9. **Non-Flyway SQL** (F19, medium): `src/main/resources/db/jobs_tables.sql`, `phase4_organization_scoping.sql`, `phase5_interviews.sql` and scripts/seed/undo SQL exist outside the 167 Flyway migration folder. Some look historical or manually applied; current legacy actual schema must clarify. The schema snapshot already has some of their entities.
10. **Active domain+field audits still absent** (F20, critical): 199 tables have owner domains; **zero** field-by-field active/retired classifications or live constraints have been verified. A source inventory cannot say the vNext DB is 100% clone-complete.

## Repo-wide discovery notes

- The recursive pinned legacy Git tree contains **2,376 tracked blob files**, **179 SQL files** (167 inside migration folder), **1,008 Java files under src/main/java**, **118 Java model files under the production model root**, and 3 dated `.history` Java model copies (not production sources). This broad file tree is an *exhaustive filename list*, not exhaustive parsed semantics.
- No definitive `@Entity` scan of every Java file outside `model/` has been completed. Automated private repository code search yielded no usable matches. Future source parity must explicitly check entity annotations, `@ElementCollection`, converters and native-query write paths.
- The historical test snapshot contains DDL but is **not equivalent** to a fresh, read-only current `information_schema` result. Hibernate auto-update, environmental Flyway drift and triggers may differ.
- The frontend product oracle has moved since previous vNext parity pins. Later workflows must be reviewed at an exact frozen FE/BE SHA combination.

## Domain-owned queue

`database-parity-full-domain-queue.json` includes exactly 199 uniquely named candidate tables assigned to:
- DB00 historical/engine triage (39: 31 backups, 7 Smrithi, Flyway metadata);
- DB01 identity/tenancy (22);
- DB02 academics (13);
- DB03 groups/electives (6);
- DB04 profile/verification (7);
- DB05 courses/content (7);
- DB06 assessment/attendance (21);
- DB07 projects (16);
- DB08 placement eligibility/outcomes (18);
- DB09 TPO/recruiter operations (31);
- DB10 shared operations (19).

**Every row status remains NOT_AUDITED**. Do not mistake "assigned domain" for "parity closed".

## Completion gate improvements

- [ ] Read-only production/legacy DB metadata export: tables, columns, defaults, FK/cascade, indexes, checks, triggers, views, routines, events, partitions; compare to source registry.
- [ ] Per-field mapping including old/renamed columns, defaults, sign/scale/timezone, computed values, unique/partial keys, tenant, security/PII, state history and storage.
- [ ] Explicit active/legacy backup/retired handling; no historical table silently dropped or automatically cloned.
- [ ] Legacy JPA mappings, native queries, optional tables from Hibernate, and dynamic migration DDL included.
- [ ] Build a complete source registry for *all* older migration side-effects and behavior, not merely the V150 snapshot's CREATE TABLE definitions.
- [ ] For all mapped concepts, compare vNext Drizzle schema + **actual PostgreSQL** and exercise negative/concurrency/cross-tenant DB tests.
- [ ] Confirm source drift and final status against freshly pinned FE/BE SHAs.

## Current decision

**Do not implement 199 tables as-is.** The goal remains complete **active product domain/data capability**, with explicit improvements and intentional retirement decisions. The next implementation work should first reconcile DB00 physical metadata; DB03, DB04 and DB08 are priority domains once their row-by-row field specifications are certified.

**Status: DEEPER INVENTORY / NO VERIFIED DB PARITY / NO NEW DRIZZLE MIGRATIONS IN THIS SWEEP.**

## Model-layer and rename extension (same sweep)

- **112 JPA entities** among **118 inspected production model files**, plus 1 mapped superclass and 5 value/support types. 111 explicit JPA `@Table` names appear in the 199-table reconstructed source registry; one `StudentImage` entity uses implicit naming. This proves *source inventory consistency*, not workflow equivalence or live schema completeness.
- `User.roles` uses `@JoinTable(name="USER_ROLES")`; `RecruiterCollegeAccess.capabilities` uses `@ElementCollection` and its own collection table. Both are data structures even without separate `@Entity` files.
- **26** JPA entities declare `@Version`; implementation that omits optimistic concurrency can lose business correctness even when all fields exist.
- Legacy `Faculty.facultyType` is an unannotated enum field, so default JPA ordinal representation is a legacy risk. Preserve meaning, not ordinal IDs.
- **13 exact renamed columns** and **24 stored UPDATE rewrite statements** discovered from `V193`, in addition to 7 table renames. See `database-parity-recruiter-rename-ledger.json`.
- `V125` conditionally drops legacy quiz JSON columns via dynamic procedure and documents their Hibernate origins. Never resurrect obsolete quizzes based on the stale snapshot alone.
- **No database migration or live table parity verified by this second sweep.**
