# DB-060 — Secure share lifecycle event completeness

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Global phase:** DATABASE  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Active source contract

The frozen legacy `TpoShareService` writes lifecycle audit rows transactionally:

- share creation inserts the link and then appends `CREATED`;
- revocation updates `revoked_at` and then appends `REVOKED`;
- open/download/email actions append additional immutable events.

The existing staged vNext event table was append-only, but append-only alone did not guarantee that lifecycle state had matching audit history.

## Gap

Before DB-060, direct SQL could:

- create a share without a `CREATED` event;
- revoke a share without a `REVOKED` event;
- insert a `REVOKED` event for a still-active share;
- insert duplicate `CREATED` or `REVOKED` events.

That breaks the source's audit contract and makes privacy/audit investigation ambiguous.

## Staged correction

The DB09 candidate SQL now adds:

1. partial unique indexes allowing at most one `CREATED` and one `REVOKED` event per share;
2. a DEFERRABLE INITIALLY DEFERRED share-link constraint trigger requiring a `CREATED` event at commit and, when revoked, a `REVOKED` event;
3. a deferred event-state trigger requiring:
   - `CREATED.created_at >= share.created_at`;
   - `REVOKED` only when the share is revoked;
   - `REVOKED.created_at >= share.revoked_at`.

Deferred checks preserve source-compatible transaction order: link/state may be written first and the event later in the same transaction.

## Required PostgreSQL witnesses after registration

- link + CREATED in one transaction succeeds;
- link without CREATED fails at commit;
- duplicate CREATED fails;
- revoke + REVOKED in one transaction succeeds;
- revoke without REVOKED fails at commit;
- REVOKED event on active share fails at commit;
- duplicate REVOKED fails;
- backdated lifecycle/use events fail;
- OPENED/download/email events appended after revoke or expiry fail;
- rollback removes both lifecycle state and event;
- event UPDATE/DELETE remains rejected by the pre-existing append-only trigger.

**Gate:** staged/source implementation only. No migration registration or PostgreSQL execution is claimed by DB-060.

## SQL quoting regression

During this pass, connector-authored PL/pgSQL additions were found with invalid single-dollar function delimiters. All affected DB-057/DB-059/DB-060 functions were repaired to actual `$$ ... $$` quoting, and the DB-060 source test now scans every function in the candidate file to reject a single-dollar delimiter before migration integration.
