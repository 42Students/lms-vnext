# DB-079 — DB09 CRM principal revocation-race hardening

**Observed:** 2026-10-12 IST  
**Worker:** Chat 1 / migration integrator  
**Registered migration:** `0048_db09_crm_principal_race_hardening`

## Why 0048 exists

Registered 0045 correctly enforced current recruiter-CRM tenant/principal and history rules, but its successful principal checks were unlocked `EXISTS` reads. A concurrent transaction could validate an ACTIVE owner/grant/company relationship and then have that principal revoked before the lead/follow-up/activity row committed.

0048 is forward-only. It does not rewrite 0045.

## Hardening

- non-destructive preflight rejects existing invalid lead owners, lead company relationships, joined recruiter/grant combinations, follow-up owners and activity actors;
- lead owner validation SHARE-locks membership, accepted role and user rows;
- lead company relationship validation SHARE-locks the relationship row;
- joined recruiter validation SHARE-locks recruiter profile, company, user, active grant and same-company relationship rows;
- follow-up owner validation SHARE-locks membership, accepted role and user rows;
- non-system activity actor validation SHARE-locks membership, accepted role and user rows;
- `placement_tpo_lead_activities` now rejects `TRUNCATE` through the same append-only rejection function used for UPDATE/DELETE.

These locks are held until transaction end. A concurrent revocation/update of the locked principal therefore serializes with the CRM write rather than invalidating it between validation and commit.

## Migration numbering correction

During implementation the repository concurrently registered 0046 recruiter-grant company integrity and 0047 assignment FILE enum alignment. An unregistered colliding `0046_db09_crm_principal_race_hardening.sql` was detected and removed before task closure. The hardening was re-registered at the next free slot, 0048, with a trigger-only snapshot chained from 0047.

## Regression contract

`tests/db079-db09-crm-race-hardening.test.mjs` verifies:

- 0048 registration exactly once and snapshot ancestry;
- unchanged Drizzle table structure;
- fail-closed existing-row preflight with no repair DML;
- SHARE locks across owner/relationship/recruiter-grant/follow-up/activity principals;
- activity TRUNCATE rejection;
- `CREATE OR REPLACE FUNCTION` usage so 0045 trigger identities are preserved rather than duplicated.

The test is registered in `test:db:parity`.

## Verification boundary

This is implementation/source completion, not PostgreSQL runtime certification. Required executed acceptance still includes two-session races for membership suspension/role removal, relationship disable, recruiter grant revocation and company/profile changes versus lead/follow-up/activity writes, plus direct TRUNCATE rejection and zero-to-head replay at the exact 0048+ SHA.
