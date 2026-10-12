# DB004 → DB012 recruiter identity/grant peer closure

**Worker:** Chat 3  
**Date:** 2026-10-12  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Status:** source/design/staging evidence only.

DB-004's remaining cross-domain queue hands 30 recruiter identity/access fields
to DB-012. All 30 now have explicit canonical dispositions in
`db01-chat03-db09-recruiter-peer-review.json`.

## Registered mappings already present

- recruiter designation → `placement_recruiter_profiles.title`
- industry company → recruiter profile `company_id`
- recruiter creator → `created_by_user_id`
- grant UUID / recruiter user / grantor / revoker / revoke timestamp /
  created/updated timestamps already have registered targets
- college and organization are normalized through
  `company_relationship -> college -> organization`, not copied independently

## Live grant semantics missing from registered vNext

Frozen legacy source proves these are current behavior, not historical columns:

- optional `valid_until`: every request rechecks expiry;
- `PENDING_HR` invite state: existing recruiter must accept before college
  access activates. Greenfield stored code is `PENDING_RECRUITER`;
- per-grant capabilities: `COLLEGE_OVERVIEW`, `DRIVE_REQUEST`,
  `DRIVE_WORK`;
- `granted_at` distinct from row creation time;
- revoke reason;
- optimistic version for concurrent lifecycle changes;
- grant origin (`SUPER_ADMIN|TPO|INVITE_ACCEPTANCE`);
- verification (`VERIFIED_DOMAIN|TPO_APPROVED|PENDING`), which current
  drive auto-approval logic actively reads;
- agency/client-company context;
- pending recruiter-lead lineage.

The staged SQL candidate adds those fields, capability and invitation-link
relations, plus append-only grant transition events.

## Deliberate redesigns

- `created_by_user_type`, `granted_by_user_type`,
  `revoked_by_user_type` are not authorization inputs. Canonical actor user
  identity plus event `actor_role_snapshot` preserves provenance without
  another free-form security discriminator.
- legacy `is_deleted` becomes explicit grant lifecycle; revoked records stay
  for history.
- recruiter `last_login_at` should be derived from append-only auth/activity
  events rather than mutable identity metadata.

## Required acceptance before core closure

1. migration integrator registers one lifecycle/company-integrity design;
2. empty/latest PostgreSQL replay succeeds;
3. expired and pending grants fail request-context authorization;
4. capability checks reject missing/unknown capability;
5. version-CAS races for extend/revoke/accept are deterministic;
6. pending invite accept/decline lineage is correct;
7. verification=PENDING cannot bypass TPO drive approval;
8. cross-company/cross-college grant forgery fails at DB and service layers.

No PostgreSQL/runtime verification is claimed by this peer pass.
