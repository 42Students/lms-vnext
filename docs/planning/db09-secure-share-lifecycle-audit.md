# DB-059 — Secure share disclosure lifecycle audit

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Global phase:** DATABASE  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Active source lifecycle

The frozen legacy `TpoShareService` creates a share link once with:

- college + job;
- token SHA-256 hash;
- normalized recipient email;
- base one-time code SHA-256 hash;
- selected disclosure columns;
- optional maximum visible application stage;
- optional shortlist deadline;
- link expiry;
- creating TPO identity.

After creation, active source code mutates only:

1. `email_code_hash` + `email_code_expires` when the recipient asks for a new emailed code; and
2. `revoked_at` when the TPO revokes the share.

The source validates usability before rotating an email code, so revoked/expired links do not receive a fresh code. Token, recipient, job, disclosure columns, stage ceiling, shortlist deadline, base code, link expiry and creator are snapshots, not editable share settings.

## Gap

The staged vNext row had shape/tenant checks but no UPDATE lifecycle guard. Direct SQL could therefore rewrite the token or recipient, point the same share at another disclosure contract, extend expiry, change the job/columns/max stage, change creator identity, clear revocation or rotate a code after link expiry.

For a privacy-bearing share token this is more than normal mutable business state: changing those fields changes what an already-issued secret grants.

## Staged correction

`db09_restrict_share_link_update` now rejects post-create changes to:

- row/tenant/job identity;
- token hash;
- recipient email;
- base code hash;
- disclosure columns;
- maximum stage;
- shortlist deadline;
- share expiry;
- creator identity;
- creation timestamp.

Allowed post-create state is narrowly bounded:

- email code hash+expiry may rotate only while the existing link is unrevoked and unexpired, and the new email-code expiry must be in the future;
- revocation may transition from null to a non-future timestamp;
- revocation cannot be cleared or rewritten;
- code rotation and revocation cannot be combined in one mutation.

Existing schema CHECKs still validate SHA-256 shapes, email-code pair shape and `revoked_at >= created_at`.

## Required PostgreSQL witnesses after migration registration

- disclosure/token/job/recipient/base-code/expiry/creator rewrite fails;
- valid live email-code rotation succeeds;
- rotation with null pair or past expiry fails;
- rotation after share expiry fails;
- rotation after revocation fails;
- first revocation succeeds;
- future revocation fails;
- clearing or changing an existing revocation fails;
- combined code rotation + revocation fails;
- immutable no-op updates remain harmless;
- share event append-only history continues to record delivery/open/download/revoke events independently.

**Gate:** staged/source implementation only. No registered migration, public share route, Node test or PostgreSQL execution is claimed by DB-059.
