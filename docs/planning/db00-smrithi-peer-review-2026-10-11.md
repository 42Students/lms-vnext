# DB00 Smrithi peer review — frozen-source and post-V150 sweep

**Peer reviewer:** Chat 1  
**Task owner:** Chat 6 / DB-003  
**Observed:** 2026-10-11  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This is additional source evidence for DB-003. It does **not** approve retirement and does **not** claim live database verification.

## 1. Post-V150 Flyway chain is now exhaustively checked

Every checked-in backend migration from **V151 through V194** was fetched from the frozen backend SHA and inspected for `smrithi` / the seven Smrithi table names.

- migrations scanned: **44**
- range: **V151–V194**
- Smrithi matches: **0**

Therefore the previous DB-003 requirement to reconcile the post-V150 Flyway chain is source-closed: no later checked-in Flyway migration creates, alters, renames, backfills, or drops these seven tables.

This does **not** prove the tables are absent from a deployed MySQL database.

## 2. Runtime configuration contains Smrithi residue / intent

The same frozen backend's `src/main/resources/application.properties` contains active-looking Smrithi configuration:

- `smrithi.master-data.seed-on-startup=true`
- `smrithi.master-data.csv-location=classpath:data/smrithi`
- `smrithi.master-data.csv-sync-on-write=false`
- `smrithi.college.name=${SMRITHI_COLLEGE_NAME:42Learn}`
- `smrithi.organization.name=${SMRITHI_ORG_NAME:42University}`
- `smrithi.email.verification.ttl-hours=${EMAIL_VERIFICATION_TTL_HOURS:24}`
- comments describe Smrithi context and Vasan master-data edits.

However, at the frozen tree:

- there are **0 backend paths containing `smrithi`**;
- there are **0 frontend paths containing `smrithi`**;
- `src/main/resources/data/` contains only `notification_templates.csv`; the configured `data/smrithi` resource directory is not present;
- indexed searches for `smrithi`, `Smrithi`, `smrithi_`, `42Learn`, and the Smrithi config keys return no code matches (index coverage is not trusted as proof);
- a targeted read of generic college/program/master-data/verification/notification candidate classes found no Smrithi implementation. The only `42Learn` hit was unrelated E2E seed naming.

This is contradictory evidence: configuration still advertises the subsystem, but the frozen source tree does not expose an obvious producer/consumer implementation.

## 3. Explicit backend source retirement on 2026-04-23

Git history provides substantially stronger evidence than the frozen-tree absence alone.

At commit `0f930a5185b2bb70c93f50d17a6bb35b4a859693` (2026-04-03), `SmrithiController.java` still exists. In commit `dd8d7abcd726e00aa7c623b93b67b4b09c736dfe` (2026-04-23, "Add feature flags, security & tenant support"), it is gone.

The paginated April 23 diff explicitly removes the live Smrithi implementation, including:

- `SmrithiController`, `SmrithiContextController`, `SmrithiJobController`, `SmrithiMasterDataController`, `SmrithiPublicJobController`;
- request/response DTOs for Smrithi signup/login/application/master data;
- `SmrithiApplication`, `SmrithiCollege`, `SmrithiEducationType`, `SmrithiProgram`, `SmrithiSpecialization`;
- their repositories;
- `SmrithiApprovalService`, `SmrithiAuthService`, `SmrithiContextService`, `SmrithiEmailVerificationService`, `SmrithiMasterDataService`, `SmrithiStudentApplicationService`;
- all corresponding service implementations, including approximately 1,188 removed lines from `SmrithiApprovalServiceImpl`;
- `SmrithiDataInitializer` and the CSV loader/writer/seeder;
- Smrithi application / education-type / specialization search caches and controllers.

The same commit also changes the access-control documentation from a distinct "Super-admin Smrithi mode" to a generic `/vasan` super-admin model. This is an explicit **source-code retirement event** for the Smrithi application/master-data subsystem.

Crucially, the commit did **not** add a Flyway drop for the seven Smrithi tables, and later V151–V194 still do not touch them. Combined with `ddl-auto=update`, that explains how historical tables/configuration can remain in a deployed schema/property file after the application code is intentionally removed.

This supports a source disposition of **RETIRED_FROM_CURRENT_BACKEND_ON_2026-04-23** for the Smrithi producers/consumers. It still does not prove that no detached external process talks directly to those tables, but the current LMS backend itself no longer does.

## 4. Why deployed table presence would not prove activity

The frozen backend also sets:

`spring.jpa.hibernate.ddl-auto=update`

and explicitly warns that this conflicts with Flyway.

Hibernate `update` can leave historical/orphan tables in place; absence of a current mapped entity does not imply an old table is dropped. Because V151–V194 also contain no Smrithi drop, a deployed schema may continue to contain these seven tables even if no current producer/consumer exists.

Therefore use these evidence labels separately:

- **runtime table presence:** still unverified;
- **post-V150 Flyway mutation:** **none found**;
- **current frozen-source producer:** not established;
- **current frozen-source consumer:** not established;
- **safe retirement:** **not approved**;
- **product disposition:** still required.

## 5. Implication for the seven tables

The current evidence supports changing the open question from:

> "Did later migrations change these tables?"

to the narrower decision:

> "Is the Smrithi/42Learn subsystem still a required product capability or an intentionally retired external/legacy subsystem?"

That decision applies to:

1. `smrithi_application`
2. `smrithi_college`
3. `smrithi_college_keywords`
4. `smrithi_education_type`
5. `smrithi_notification_template`
6. `smrithi_program`
7. `smrithi_specialization`

Do not map them into vNext merely because historical tables/config exist, and do not retire them merely because current source producers were not found.

## 6. Remaining proof needed to close DB-003

One of these must be recorded explicitly:

- **retain/redesign:** product confirms Smrithi/42Learn is still required, then active semantics are mapped into canonical vNext persistence/APIs; or
- **retire:** product confirms it is out of vNext scope and any external/deployed consumer dependency is ruled out or deliberately sunset.

A live MySQL catalog check can establish whether the seven tables still physically exist, but because `ddl-auto=update` can preserve orphans, existence alone must not be treated as active-consumer evidence.
