# DB-050 — Global recruiter email suppression must survive tenant and key changes

**Date:** 2026-10-11 · **Owner:** Chat 3 · **Global phase:** DATABASE · **Queue:** DB-050  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Status:** CODE + STAGED SCHEMA + SOURCE REGRESSION AUTHORED, migration registration/PG sender acceptance **NOT VERIFIED**. GitHub Actions intentionally unused due to billing.

## The demonstrated schema/producer mismatch

Legacy `EmailSuppressionEntity.java` maps `email_suppression.email_norm` as the **single primary key**, with no organization/college discriminator; `EmailSuppressionRepository.java` is `JpaRepository<EmailSuppressionEntity,String>`. A recipient asking to stop email from the recruiter workflow cannot safely be contacted through a second college simply because that college has another UUID.

Before DB-050, vNext `outbound_suppressions` was scoped to `(organization_id, channel, recipient_hash)`, and `src/modules/operations/outbound-delivery-envelope.ts` computed `recipientHash = HMAC(digestKey, ["organization UUID", channel, canonical recipient])`. The queue checked only the issuing organization. **A normalized address under organization B hashes differently from the same address under A**, so an opt-out in one scope does not represent the legacy global-by-email semantics. This is a code/design mismatch, NOT a demonstrated production email send: the new outbox is still activation-gated and the database draft is unregistered.

### Implemented stage, exact files

| File | Implementation |
| --- | --- |
| `src/modules/operations/outbound-delivery-envelope.ts` | `deriveGlobalEmailSuppressionHash` derives a deterministic EMAIL-only HMAC over the **canonical normalized address**, with label `global-email-suppression-v1` and separate dedicated key; no raw address or global correlation hash is added to the persisted envelope. |
| `src/modules/operations/outbound-delivery-queue.ts` | EMAIL queueing derives the key from `DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64` and checks both active tenant-local suppression and global-email suppression before insertion; returns `SUPPRESSED` for either; remains gated behind `DB10_OUTBOUND_READY=DB10_VERIFIED`. |
| `src/db/schema/db10-outbound-messages.draft.ts` | Adds **unregistered** `db10GlobalEmailSuppressions` with no tenant discriminator, HMAC-only recipient, partial active unique index, ordered clear timestamp and allowed reasons `UNSUBSCRIBED`, `BOUNCE`, `COMPLAINT`. Existing organization-local table retains `ADMIN_BLOCK` and other channels. |
| `docs/planning/sql/db10-global-email-suppression-candidate.sql` | Reference DDL and disposable PostgreSQL adversarial witness list for Chat 1. **Do not run alongside duplicate Drizzle generated DDL**. |
| `tests/unit/outbound-global-email-suppression.test.ts` | Seven Vitest regression cases for cross-org identical email hashes, tenant-local distinctness, canonicalization, keyed HMAC, secret separation/encryption key rotation, EMAIL-only application, missing key and invalid recipients. |
| `tests/db10-global-email-suppression-contract.test.mjs` | Five zero-dependency source-contract cases for draft shape, unique active index, non-PII identity, queue dual-scope checks and activation gates. |

## Deliberate boundaries

1. **Global opt-out applies only to EMAIL.** Local `ADMIN_BLOCK` is a different tenant-owned policy. Do not suddenly extend an email unsubscribe to WhatsApp/SMS in the absence of an explicit consent contract.
2. **No plaintext email in long-lived tables or logs.** Normalized recipient is HMAC'd with a dedicated stable secret. A plain SHA256 of an email is dictionary-reversible and unacceptable.
3. **Dedicated secret is independent of outbound AES ciphertext key.** The HMAC key must remain stable across ordinary encryption rotation. If changing the global HMAC secret is necessary, preserve old-version lookup or perform a securely authorized re-key before removing the old key; otherwise users who opted out become contactable again.
4. **Missing global HMAC secret fails closed for EMAIL queueing.** The old organization recipient HMAC cannot silently become the fallback.
5. **Outbound still has no enabled sender.** This work does NOT deliver mail, register the migration, expose an unsubscribe endpoint or certify the provider API. The table requires strict DB roles and a trusted audited global suppression writer (e.g. verified unsubscribe/bounce/complaint event).
6. **Queued-before-opt-out races remain unsolved until the dispatcher exists.** The queue anti-join is atomic for its insertion statement, but an opt-out can commit after that statement. The future dispatcher MUST recheck global+local suppression just before provider dispatch and protect a concurrent suppress/send handoff with an accepted transaction/lease protocol. No source assertion proves that witness.
7. **Global hash linkability is itself sensitive.** It is not stored on regular outbox rows, and global suppression membership should only be visible to privileged services, never to recruiters/colleges.

## Verification evidence and unexecuted gates

- The five committed source-guard test callbacks were **actually executed** against connected GitHub file contents with a JavaScript V8 assertion/readFileSync shim: **5/5 passed**, exact source behavior asserted. This is *not* a Node runner test, TypeScript typecheck, or PostgreSQL test.
- Seven Vitest functional tests are **authored, not executed**; invoke `npx vitest run tests/unit/outbound-global-email-suppression.test.ts` in a checkout with dependencies.
- Node static suite is authored; normal command is `node --test tests/db10-global-email-suppression-contract.test.mjs`. Source callbacks were executed with a shim; this exact Node command was not run in the connected repository environment.
- Migration replay, SQL constraints, wrong-college negative witnesses, stale-clearing tests, simultaneous unsubscribe/dispatch, privilege assertions, and sender integration **NOT EXECUTED**.
- Source tree `src/db/schema/index.ts` still does not register the draft. Do not set `DB10_OUTBOUND_READY=DB10_VERIFIED` until database and delivery tests pass.

## Migration-integrator handoff and dependencies

Chat 1 owns `drizzle/**`, the schema barrel and the independent disposable PostgreSQL replay. Integrate the **canonical draft TS table once** rather than execute both its generated DDL and the SQL candidate. Parent `outbound_messages` and tenant-scoped `outbound_suppressions` remain required. Choose and document access privileges before enabling the new table. Verify `DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64` is a separate canonical 32-byte base64 secret and is provisioned in the sender/verified unsubscribe writer, never in a frontend bundle. The receiver should not need to see unrelated colleges or HMAC values.

This batch can be **implementation-COMPLETED** without treating it as independently `DONE_VERIFIED`. The overarching DATABASE phase stays active until all global DB gates carry executed proof.
