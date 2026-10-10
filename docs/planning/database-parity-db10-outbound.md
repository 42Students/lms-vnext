# DB10 Shared Outbound Delivery — W06 code-stage and activation contract

**Owner:** W06 issue #26 · **Consumer:** W05 issue #25 (recruiter invitations and reminders) · **Migration owner:** W01 issue #21  
**Legacy references:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` — `NotificationOutboxService.java`, `NotificationOutboxEntry.java`, `EmailSuppressionEntity.java`, `docs/tpo-v1/EMAIL-TEMPLATES.md`; FE `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.  
**Status:** CODE_STAGED / MIGRATION_BLOCKED / PROVIDER_NOT_CONNECTED / TESTS_NOT_EXECUTED. This is **not an email sending feature**.

## What was implemented

- `src/modules/operations/outbound-delivery-contract.ts` has strict server-only intent validation for EMAIL/SMS/WHATSAPP and two recruiter invitation template intents. Channel addresses are normalized; a URL containing a bearer invitation token must be HTTPS. Invalid input raises only fixed error codes, not token-bearing Zod diagnostics.
- `src/modules/operations/outbound-delivery-envelope.ts` seals recipient address, invitation URL and merge variables with AES-256-GCM using HKDF-separated keys. Persisted ciphertext is bound to tenant, event, recipient HMAC, template, channel and idempotency HMAC as additional authenticated data. An operation-specific random nonce prevents ciphertext reuse. No recipient address or raw invitation token appears in the DB envelope.
- `src/modules/operations/outbound-delivery-policy.ts` encodes pending/claim/retry/accepted/delivered/expired/blocked/bounced outcomes, suppression and bounded retry. **PROVIDER_ACCEPTED is not DELIVERED.**
- `src/modules/operations/outbound-delivery-queue.ts` has `queueOutboundDeliveryInTransaction(db, context, intent)` and nontransactional `queueOutboundDelivery(context, intent)`, both **fail-closed** unless `DB10_OUTBOUND_READY=DB10_VERIFIED`. A trusted W05 transaction should call the in-transaction version with the W05 mutation's database handle. Permission `placements.manage` is enforced, active organization/college match is rechecked against PostgreSQL, suppression is checked, and unique idempotency conflicts distinguish an exact retry from reissued-token changes. Return statuses: QUEUED, ALREADY_QUEUED, SUPPRESSED. **No SENT return status.**
- `src/db/schema/db10-outbound-messages.draft.ts` stages normalized encrypted outbox + recipient suppression tables. **Not exported from the shared schema barrel and not migrated.** Only W01 may create Drizzle migrations.
- Tests authored: `tests/unit/outbound-delivery-envelope.test.ts`, `tests/unit/outbound-delivery-policy.test.ts`, `tests/integration/db10-outbound-queue.test.ts`, and a static no-migration gate check. No passing runtime evidence is claimed.

## W05 producer interface

After successfully authenticating the TPO and verifying its persisted relationship/contact ownership, generate or reuse one stable `sourceEventId` UUID for each intended delivery. In the same DB transaction that issues the invite token, call:

```ts
await queueOutboundDeliveryInTransaction(tx, context, {
  organizationId: persistedOrganizationId,
  collegeId: persistedCollegeId,
  sourceEventId: persistedInvitationEventId,
  channel: "EMAIL",
  templateKey: "RECRUITER_INVITATION", // or RECRUITER_INVITATION_REMINDER
  recipient: persistedContactEmail,
  variables: {
    contactName: persistedContactName,
    companyName: persistedCompanyName,
    collegeName: persistedCollegeName,
    invitationUrl: oneTimeHttpsUrl,  // raw only in process memory until sealed
    signature: optionalSenderSignature,
    note: optionalPersonalNote,
    expiresDays: optionalExpiryDays,
  },
  notBefore: optionalOffsetDatetime,
  expiresAt: optionalOffsetDatetime,
});
```

The only stable per-recipient keys in DB are **secret-keyed HMACs**, including an idempotency HMAC of `organizationId + sourceEventId + channel + templateKey + recipient`. A retry with the same source event and recipient returns ALREADY_QUEUED only if the payload fingerprint also matches. A different invite token under the same source event raises OUTBOUND_IDEMPOTENCY_CONFLICT. For legitimate reissue, W05 must issue a distinct persisted event ID. **Never put the raw token into audit logs, activity metadata, notifications, plain JSON columns or error messages.**

The legacy `hr-invite` template expects `name, company, collegeName, signature, link, note, expiresDays`. The vNext normalized intent uses `contactName, companyName, invitationUrl` for those fields. **The provider renderer must perform that mapping; it is not implemented by this code stage.** Legacy also contains day-3/day-6 reminders while the current W05 acceptance notes mention day-4; the scheduling decision belongs to W05 after verifying product requirements. Do not silently change timing.

## Migration, provider, and proof still missing

1. W01 review and register the two DB10 draft tables, checks, partial active-suppression unique index, migrations and snapshot in a **single integrated migration batch**, then replay empty and existing disposable DBs. W06 does not edit `drizzle/**` or `src/db/schema/index.ts`.
2. Inject a random 32-byte `DB10_OUTBOUND_ENCRYPTION_KEY_BASE64` via secret storage, never commit or return it to the browser; plan `keyId` rotation and old ciphertext decrypt access. The key used in tests is test-only.
3. Add an actual provider adapter with configured template IDs and DLT registration where applicable. No template, credentials or DLT should yield a fixed FAILED/PENDING diagnostic, **never a false send**. Provider APIs and callback verification are *not* implemented yet.
4. Build a lease-fenced dispatcher using W06 PostgreSQL claim, retry and reconciliation, **provider-side idempotency keys**, recheck active suppression just before each external send, record accepted/delivered/bounce separately, and prevent sending revoked/replaced invitation URLs.
5. Persist unsubscribe/Not Hiring/complaint/bounce suppression *within each appropriate tenant/recipient channel* and verify this behavior from W05 requests. Race handling at enqueue alone is insufficient: the dispatcher must recheck.
6. Run the new tests on a disposable database using `DB10_ISOLATED_TEST_DATABASE=1`, including 100-way enqueue/retry races, changed-token conflict, cross-college denial and concurrent suppress/send. Run lint/typecheck/build and real provider sandbox E2E; probe logs for plaintext token leaks.
7. **Only after 1–6** set `DB10_OUTBOUND_READY=DB10_VERIFIED` for queuing; external delivery requires its own separately verified provider enablement. Until then W05 must continue returning `TPO_RECRUITER_INVITE_DELIVERY_PENDING` for `sendEmail=true` and must not claim an invite was sent.

## Parity caveat

Legacy `notification_outbox` includes APP channel, undo-group 30-second hold, digest scheduling, SMS cap and many other student/TPO events. This W06 stage models **only recruiter invitation/reminder external-delivery intent** and explicitly does **not** replace the APP notification contract, daily digest, undo cancellation, template registry or the rest of the 19 DB10 source-table inventory. All related field-level mapping and browser/transport verification remains OPEN. `DB10` global semantic verification stays 0/221 until actual evidence exists.
