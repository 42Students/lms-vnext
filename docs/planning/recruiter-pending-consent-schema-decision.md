# Recruiter pending-college-consent persistence decision

**W01 owner:** issue #21  
**Consumer:** W05 / issue #25  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Status:** source decision complete; live Drizzle migration NOT registered or runtime verified.

## Exact legacy behavior

`RecruiterInviteService.accept` distinguishes account existence:

- brand-new recruiter: the invite creates the account and immediately creates/reactivates college access as `ACTIVE`;
- existing recruiter: the invite creates/updates college access as legacy code `PENDING_HR`, records `pending_recruiter_lead_id`, and returns a one-more-step response. The recruiter must sign in and explicitly accept;
- pending accept: status becomes `ACTIVE`, `granted_at` is refreshed, `valid_until` is calculated, and the recruiter lead is linked to that recruiter;
- pending decline: status becomes `REVOKED`, `revoked_at` and reason are recorded;
- pending rows are shown only to that recruiter. No college data is shared before acceptance.

The old constant retained the historical string `PENDING_HR` even after HR→Recruiter naming. vNext will store the semantically renamed value `PENDING_RECRUITER`.

## vNext normalized decision

Extend `placement_recruiter_college_grants` with:

- status vocabulary: `PENDING_RECRUITER | ACTIVE | REVOKED`;
- nullable `pending_recruiter_lead_id` → `placement_tpo_leads.id`;
- nullable `valid_until` for time-bounded access;
- nullable `revoke_reason`;
- at most one live (`PENDING_RECRUITER` or `ACTIVE`) grant per recruiter/company relationship.

The existing request-context loader already queries only ACTIVE grants, so a pending row remains authorization-invisible. W05 must still implement explicit list/accept/decline service/API/UI workflows and must atomically consume the invite token.

## Separate unresolved capability gap

Legacy `recruiter_college_access_capability` stores per-college capabilities. Current vNext recruiter authorization currently exposes broad `placements.recruiter.read` and `placements.recruiter.result.stage` based on any active grant and does not load capability rows. This document does **not** certify that as parity. Capability semantics need a separate source-backed redesign/ledger before DB01 can close.

## Migration ordering

The staged SQL is `scripts/sql/w01-recruiter-pending-consent-staging.sql`. It depends on W05's staged `placement_tpo_leads` table, so W01 must register it only after DB09 lead schema promotion. Do not execute this staging file against production or add it to the Drizzle journal manually. Real `drizzle-kit generate`, journal/snapshot ancestry, empty-Postgres replay, tenant-negative tests and recruiter workflow tests remain required.
