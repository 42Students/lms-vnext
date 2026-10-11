# DB09 TPO settings normalization — DB-034

**Date:** 2026-10-11  
**Worker:** Chat 3  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Status:** source-backed staging; unregistered and unexecuted

## Why this exists

Two active legacy TPO settings were persisted as JSON identifier/string arrays:

- `trusted_domains_json`
- `prep_course_ids_json`

The arrays are not passive preferences.

`TpoDriveService.isTrustedRecruiter` uses the trusted-domain list to auto-approve a recruiter's drive request after the recruiter is no longer in pending verification. A malformed or overly broad value can therefore change an authorization/workflow decision.

`TpoStudentsReadService.prepAverages` uses the prep-course list to calculate learner readiness from submitted quiz attempts. A stale or foreign course ID changes the readiness signal.

The current vNext staging originally copied both arrays into `placement_tpo_college_settings` JSONB. That preserved shape but not referential or policy integrity.

## Legacy producer semantics

`TpoSettingsHubService.saveCollege` normalizes every trusted domain by:

1. trimming;
2. lowercasing;
3. removing one leading `@`;
4. requiring `^[a-z0-9.-]+\.[a-z]{2,}$`;
5. rejecting a fixed free-mail set;
6. de-duplicating the list.

The free-mail set at the frozen oracle is:

`gmail.com`, `googlemail.com`, `yahoo.com`, `yahoo.co.in`, `yahoo.in`, `ymail.com`, `outlook.com`, `outlook.in`, `hotmail.com`, `live.com`, `msn.com`, `icloud.com`, `me.com`, `aol.com`, `rediffmail.com`, `protonmail.com`, `proton.me`, `zohomail.com`, `zohomail.in`, `mail.com`, `gmx.com`, `yandex.com`.

Prep-course input is serialized from the incoming collection. The selectable course list is organization-scoped: `prepCourses(organizationId)` reads non-deleted courses created by the organization. The readiness consumer later scopes learner quiz attempts to the learner's college while filtering by those selected course IDs.

## Canonical vNext redesign

### Trusted domains

Replace `placement_tpo_college_settings.trusted_domains` with:

`placement_tpo_trusted_domains(college_id, domain, created_by_user_id, created_at)`.

Database invariants:

- primary key `(college_id, domain)`;
- lowercase + trimmed;
- legacy-compatible domain shape;
- legacy free-mail denylist enforced in DB;
- writer must satisfy `db09_has_active_tpo_actor` for that college.

The runtime settings API may still expose `trustedDomains: string[]`, but it must transact against rows rather than a JSON blob. Read = ordered/list projection; save = atomic set replacement/diff.

Trusted-domain matching for recruiter drive auto-approval remains **exact domain equality**. It must not become suffix/wildcard matching.

### Prep courses

Replace `placement_tpo_college_settings.prep_course_ids` with:

`placement_tpo_prep_courses(college_id, course_id, created_by_user_id, created_at)`.

Database invariants:

- primary key `(college_id, course_id)`;
- real FK to `courses(id)`;
- selected course must be ACTIVE;
- its department must not be archived;
- its owning college must be ACTIVE;
- the course-owning college and settings college must share the same organization;
- writer must satisfy `db09_has_active_tpo_actor`.

The same-organization rule deliberately preserves the old `prepCourses(organizationId)` selector. Restricting to the exact same college would be a product behavior change; allowing another organization would be weaker than the source boundary.

The settings API may still expose `prepCourseIds: string[]`, but those IDs are projections from normalized rows.

## Structural schema decision

`src/db/schema/tpo-collaboration.ts` no longer carries `trustedDomains` or `prepCourseIds` JSON fields. It defines the two normalized tables instead. This avoids two writable canonical copies.

`notify_toggles`, `job_types` and `outcome_labels` remain separate settings concerns; DB-034 does not redesign them.

## Migration/integration order

W01 must register:

1. core college/user/department/course parents;
2. DB09 collaboration tables and `db09_has_active_tpo_actor`;
3. the DB-034 normalized settings tables and scope triggers.

Because vNext is greenfield with no production data migration requirement, there is no JSON-to-row backfill requirement unless test fixtures or seeded development data create the old JSON shape before registration. If such data exists, W01 must explicitly transform or fail rather than silently drop it.

## Runtime/API cutover requirements

Later API work must:

- return the same array-shaped settings contract if UI parity needs it;
- write set changes transactionally;
- never write the retired JSON columns;
- make trusted recruiter lookup query exact normalized domain rows;
- keep the existing "verification must not be PENDING" precondition;
- compute readiness using normalized prep-course rows;
- continue scoping learner attempts to the learner's college;
- treat missing rows as empty lists.

## Acceptance witnesses

Disposable PostgreSQL must prove:

1. valid lowercase company domain insert succeeds;
2. malformed, uppercase, leading-`@`, and every free-mail value is rejected;
3. duplicate domain race yields one row;
4. inactive/foreign/non-TPO writer is rejected;
5. same-organization active prep course succeeds;
6. cross-organization course is rejected;
7. archived department/owning college or inactive course is rejected;
8. nonexistent course is rejected by FK;
9. duplicate prep-course race yields one row;
10. settings set-replacement is atomic under a forced mid-transaction failure;
11. drive auto-approval cannot match a domain from another college;
12. readiness cannot consume a prep course from another organization;
13. empty rows project to empty arrays.

**Evidence classification:** source/design only. No Node or PostgreSQL execution is claimed by this document.
