# DB-031 — DB10 privacy-safe SMS provider attempt ledger

**Worker:** Chat 5  
**Global phase:** DATABASE  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Staging SQL:** `scripts/sql/db10-sms-delivery-attempts-staging.sql`  
**Status:** SOURCE_REVIEWED / STAGED_NOT_REGISTERED / POSTGRES_NOT_RUN

This task preserves a current support/audit data concept that is distinct from
the recruiter invitation command outbox. It does **not** implement an SMS
sender and does not broaden any provider permission.

## 1. Why sms_delivery_log is active source behavior

Legacy `V134__sms_delivery_log.sql` introduced a thin provider-attempt record
so support can answer whether an absence/notification SMS was actually
attempted and whether the operator accepted it.

The pinned current source still has active writers and a product consumer:

- `BulkSmsAppsServiceImpl.record(...)` writes an attempt for OTP, job update
  and general notification paths.
- `ExotelSmsServiceImpl` is `@Primary` and writes the same log for current
  OTP, job update and general notification sends, including missing DLT/config
  failures.
- `AdminSmsLogController /api/v1/admin/sms-log` is a super-admin support
  surface that searches newest-first by recipient suffix and purpose.
- `SmsDeliveryLogRepository.search` is the persistence read path.

This is therefore not a dead historical table and must not be silently retired.

## 2. Truthful status semantics

Legacy names a successful provider response `SENT`, but the source comments
and admin response explicitly say this only means **the SMS operator accepted
the request**. It is not proof that a handset received the message.

DB-031 intentionally renames that durable outcome:

| Legacy | Canonical vNext |
| --- | --- |
| `SENT` | `PROVIDER_ACCEPTED` |
| `FAILED` | `FAILED` |

No `DELIVERED` state is invented for this table because the reviewed current
legacy providers do not provide handset-delivery proof in this write path. If a
future callback supplies delivery receipts, model those as separately verified
provider events or extend the lifecycle with explicit source evidence.

## 3. Privacy contract

The legacy migration deliberately does **not** retain:

- message body;
- full recipient phone;
- OTP;
- provider credentials.

It keeps only a short recipient suffix so a support admin can answer
“was an attempt made to the number ending 4821?”

DB-031 preserves this behavior. The proposed table has no column capable of
storing body, full number, OTP or credential. `recipient_suffix` permits at
most four digits and is intentionally collision-prone; it is a support hint,
not a user identity.

Provider failure persistence is also tightened: persist a fixed safe code and/or
sanitized support summary, not raw provider response bodies, request URLs or
exception strings that may contain secrets.

## 4. Why this does not duplicate the encrypted outbound queue

The existing DB10 outbound draft is a **command queue** for recruiter
invitation/reminder external delivery. It stores encrypted recipient/template
inputs, claim/retry state, suppression and the latest provider outcome.

DB-031 is an **append-only attempt ledger**:

- it can record current OTP and attendance/general notification sends that never
  came through the recruiter command queue;
- one logical outbound command can have multiple provider attempts;
- historical failed attempts remain visible instead of being overwritten by a
  later retry success;
- it is support/audit evidence, not a dispatch source.

A later integrated sender may write both models transactionally where
applicable: the command row is current orchestration state, while each actual
provider call appends one immutable attempt row.

The optional `source_event_id` is a producer correlation only. It is not an FK
to the recruiter outbox because current OTP/general SMS paths may not have such
a command row.

## 5. Proposed columns

| Column | Meaning |
| --- | --- |
| id | UUID attempt identifier |
| organization_id / college_id | optional tenant scope; both null for legitimate pre-membership/global sends such as login OTP |
| purpose | source business purpose; deliberately not enum-locked |
| provider | provider identifier such as EXOTEL or BULKSMSAPPS |
| recipient_suffix | last 1–4 digits only |
| outcome | PROVIDER_ACCEPTED or FAILED |
| provider_message_id | opaque provider trace id for accepted calls |
| safe_failure_code | fixed machine-safe failure classification |
| safe_failure_summary | sanitized bounded support text |
| source_event_id | optional producer/business correlation |
| attempt_number | positive retry/attempt sequence |
| provider_accepted_at | acceptance clock, only on PROVIDER_ACCEPTED |
| created_at | immutable ledger time |

Tenant-scoped attempts require organization and college together. The staged
trigger verifies that the college belongs to the supplied organization.
Global/pre-login attempts use both null.

## 6. Purpose values

Current reviewed writers persist:

- `otp`;
- `job.update`;
- `notification`.

Legacy V134 comments also document more specific intended values such as
`attendance.absence` and `attendance.correction`.

DB-031 deliberately does **not** database-enumerate purpose. Purpose is an
evolving business classification; validity belongs in typed producer code while
the database requires nonblank text. This avoids a migration for every new
notification purpose while preserving queryability.

## 7. Append-only decision

The source table is delivery history. Rewriting an old failure into success
would destroy the evidence support relies on.

DB-031 therefore stages an UPDATE/DELETE blocker. A retry is a new row with a
higher `attempt_number`; retention/purge, if later required by privacy policy,
must be a separately approved privileged lifecycle rather than ordinary product
mutation.

## 8. Relationship to generic TPO notices

DB-024 stages durable APP/EMAIL/SMS notice intent, undo groups, digest timing and
fenced claiming. DB-031 is lower-level provider evidence and does not duplicate
DB-024 event/recipient state.

When DB-024 eventually hands an SMS notice to a provider adapter, the provider
attempt can append DB-031 with the same stable source event id. APP notices do
not create SMS attempts.

## 9. Relationship to notification templates and DLT

The current Exotel path fails closed when required DLT configuration is absent
and writes a FAILED attempt. That is active behavior worth preserving.

DB-031 does not persist raw DLT template bodies or provider credentials.
Provider/template configuration stays in the separate template/config contract.
The attempt ledger may use a safe failure code such as
`DLT_TEMPLATE_MISSING`, never the secret request body.

## 10. PostgreSQL / workflow acceptance — ALL NOT_RUN

- **DB31-01:** accepted OTP append stores purpose, suffix, provider id and
  PROVIDER_ACCEPTED; no phone/body/OTP columns exist.
- **DB31-02:** failed missing-DLT job update persists FAILED with safe reason and
  no provider acceptance timestamp.
- **DB31-03:** provider acceptance cannot be stored without nonblank
  provider_message_id and provider_accepted_at.
- **DB31-04:** accepted row rejects failure code/summary contamination.
- **DB31-05:** failed row requires a safe code or nonblank sanitized summary.
- **DB31-06:** suffix with more than four digits or non-digits is rejected.
- **DB31-07:** both organization/college null is accepted for pre-login OTP.
- **DB31-08:** tenant-scoped row requires both organization and college.
- **DB31-09:** forged organization/college pair is rejected with SQLSTATE 23514.
- **DB31-10:** UPDATE and DELETE are rejected by append-only trigger.
- **DB31-11:** two retries append two rows; earlier failure is not overwritten by
  later provider acceptance.
- **DB31-12:** support query by suffix+purpose returns newest attempts without
  exposing recipient/body secrets.
- **DB31-13:** one outbound command may correlate multiple attempts without a
  duplicate-send uniqueness constraint on source_event_id.
- **DB31-14:** raw provider response containing a phone/body/credential is
  sanitized before persistence; database row contains only approved fields.
- **DB31-15:** generic SMS attempts work independently of recruiter invitation
  template-key constraints.
- **DB31-16:** numbered migration replay, trigger inspection and catalog/snapshot
  drift checks pass after Chat 1 integration.

No witness above is passing merely because this document or a test exists.

## 11. Integration ownership

Chat 1 exclusively owns numbered Drizzle migrations and
`src/db/schema/index.ts`. DB-031 must be integrated without turning the
recruiter-only command contract into a generic unauthenticated send API.

API/provider phase work must:

1. add a privileged append helper;
2. derive provider/purpose from trusted server code, never arbitrary browser
   input;
3. sanitize failure details;
4. append after each real provider call;
5. retain super-admin-only support access or an equivalently restrictive policy;
6. verify retention/redaction policy.

## Completion boundary

DB-031 can be **COMPLETED, unverified** after the isolated SQL, this source
contract and static shape tests are committed. It is not DONE_VERIFIED until
the registered PostgreSQL migration and applicable DB31-01..16 witnesses pass
on an integrated source SHA.
