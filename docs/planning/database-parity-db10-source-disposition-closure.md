# DB-046 — DB10 221-field source-disposition closure

**Worker:** Chat 5 · **Phase:** DATABASE  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Ledger:** `docs/planning/database-parity-db10-field-ledger.json`  
**Overlay:** `docs/planning/database-parity-db10-source-disposition-closure.json`  
**State:** **221/221 source-dispositioned · 221/221 UNMAPPED · 0/221 runtime verified**

DB-046 closes the DB10 source/design denominator. It does **not** certify the
database phase.

Before this batch, 144/221 rows had explicit per-field `sourceDisposition`.
The remaining 77 belonged to already source-reviewed Chat 5 families:

| Family | Fields |
| --- | ---: |
| app_setting | 9 |
| log_alert_signature | 17 |
| log_alert_signature_account | 3 |
| log_alert_state | 4 |
| notification | 21 |
| skill_synonyms | 3 |
| skill_usage | 3 |
| skills | 9 |
| sms_delivery_log | 8 |
| **Total** | **77** |

## What “source-dispositioned” means

A disposition says whether a legacy concept is directly preserved, normalized,
redesigned, staged, or retired and names its intended vNext owner. It does not
mean a migration exists, a producer writes it, a consumer reads it, PostgreSQL
replay passed, a race/tenant/privacy witness passed, or retirement was approved.

Therefore **every shared ledger row remains `UNMAPPED`** and the verified count
remains zero.

## Pinned decisions

### Notification (21)
DB-043 separates campaign authoring/schedule/audience from per-user
`in_app_notifications` receipts. The legacy shared `is_read` bit is not
cloned; recipient `read_at` remains per user.

Adversarial review found and fixed a real post-checkpoint staging defect:
`NotificationServiceImpl.ensureNotificationType` actively defaults null
non-course notifications to **GENERAL**, while the initial DB-043 SQL allowed
only JOB/COURSE/SYSTEM. Current main now includes GENERAL in the staged CHECK,
field map, contract and static guard.

### app_setting (9)
DB-033 proved the generic K/V table mixes unrelated domain policy/config. The
physical fields therefore map to domain-owned typed setting semantics rather
than a recreated universal string table.

`scope_id_key` is explicitly retired storage machinery. Legacy V138 generated
it as `IFNULL(scope_id,-1)` solely so MySQL could enforce GLOBAL uniqueness
when `scope_id` is NULL. It has no independent product meaning in PostgreSQL.

### Log alerts (24)
DB-023 remains authoritative:
- durable triage state maps to staged log-alert tables;
- `occurrence_count` stays true BIGINT and must not pass through JS Number;
- legacy role-scoped numeric `account_id` becomes a keyed HMAC of a
  server-verified typed identity, **not** `users.id`;
- sample message/path require redaction, retention and scoped access.

### Skills (15)
DB-022 preserves two independent counters:
- `skills.usage_count` for catalog ranking;
- `skill_usage.usage_count + last_used` for free-text tracker ranking.

They must not be merged. Synonyms remain non-globally-unique.

### SMS delivery log (8)
DB-031 remains authoritative:
- legacy `SENT` means **PROVIDER_ACCEPTED**, never handset delivery;
- only last-four recipient suffix persists;
- raw provider errors become safe code/summary;
- tenant scope is strengthened to a validated org/college pair where present;
- pre-login OTP attempts may remain global.

## Ledger invariants after DB-046

The closure guard expects:

- 19 tables;
- 221 legacy fields;
- 221 source-reviewed fields;
- **221 source-dispositioned fields**;
- **0 source-disposition missing**;
- **221 UNMAPPED fields**;
- **0 verified fields**.

If later executed evidence advances fields from UNMAPPED, the closure test must
be deliberately updated together with DB19/DB20 evidence. Nobody should weaken
it just to make a build pass.

## Work still required

1. Chat 1 migration integration for staged schemas/SQL.
2. Empty/latest disposable PostgreSQL replay and catalog/snapshot drift.
3. Runtime producer and consumer cutover.
4. Tenant, privacy, negative and concurrency witnesses.
5. DB19 whole-database field verification.
6. DB20 end-to-end DATABASE certification.

CI billing is not a blocker; runtime verification remains pending until the
CI-independent database path can execute the integrated migrations.

## Acceptance requirements — source closure

- **DB46-01:** overlay contains exactly 77 unique legacy IDs.
- **DB46-02:** overlay table counts sum to 77 with the family counts above.
- **DB46-03:** every overlay ID exists exactly once in the 221-row ledger.
- **DB46-04:** ledger contains exactly 221 fields.
- **DB46-05:** all 221 rows have a nonblank sourceDisposition.
- **DB46-06:** sourceDispositionMissing is zero.
- **DB46-07:** all 221 rows remain UNMAPPED at source-closure time.
- **DB46-08:** verified count remains zero.
- **DB46-09:** every overlay runtimeVerified flag is false.
- **DB46-10:** every overlay finalDispositionApproved flag is false.
- **DB46-11:** current DB-043 SQL and field map include GENERAL.
- **DB46-12:** notification is_read maps to per-user in_app_notifications.read_at.
- **DB46-13:** app_setting.scope_id_key is a retired MySQL helper.
- **DB46-14:** app_setting.setting_value maps to typed domain-owned config/value.
- **DB46-15:** log-alert account_id maps to account_key_hash, not users.id.
- **DB46-16:** log-alert occurrence_count carries precision-redesign semantics.
- **DB46-17:** skills and skill_usage usage counters remain distinct targets.
- **DB46-18:** SMS legacy SENT semantics map to PROVIDER_ACCEPTED.
- **DB46-19:** no overlay row claims runtime verification/final retirement.
- **DB46-20:** DB19/DB20 remain the authority for advancing source disposition to verified parity.

## Completion boundary

DB-046 is **COMPLETED, unverified** when the overlay, shared-ledger update,
closure contract and static guard are committed and cross-file consistency
passes. It is never DONE_VERIFIED from source evidence alone.
