# DB-017 — DB09 grant same-company registration (2026-10-12)

Forward-only `0046_db09_recruiter_grant_company_integrity.sql` applies three safeguards after `0045`: (1) a recruiter grant may only link recruiter and company relationship sharing an identical company; (2) recruiter profile company cannot change while any grant (even revoked) references it; (3) company relationship cannot switch companies while grant history references it. This does not replace college/role/status authorization.

Source: `docs/planning/sql/db09-recruiter-grant-company-integrity-candidate.sql`, `docs/planning/db09-recruiter-grant-company-audit.md`. Original draft remains **staged only**: do not apply it again. No changes to SQL tables/columns/enums in Drizzle snapshot; version advances ancestry only.

**Acceptance OPEN:** run `npm run db:journal:verify`, `node --test tests/db017-db09-recruiter-company-registration.test.mjs`, `npm run db:verify:independent`, and opt-in two-session witnesses in `tests/db09-grant-company-isolation.test.mjs` using disposable PostgreSQL. No SQL replay or runtime tests are claimed successful here.

Known unresolved: row-level role/status policies, independently staged collaboration/scheduling and DB04/DB05/DB08 schemas, parent reparent transactions and exact service workflow compatibility.
