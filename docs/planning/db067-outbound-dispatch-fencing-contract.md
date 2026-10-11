# DB-067 — outbound dispatch claim/fencing and late suppression (source staging)

**Phase:** DATABASE · **Worker:** Chat 2 · **State:** Source implementation staged on `main`, **not registered**, **not executed against PostgreSQL**, no provider dispatch.

**Original gap:** `docs/planning/database-parity-pass5-probe-manifest.json` P5-R09 (two senders, retry and stale worker) and P5-R21 (unsubscribe after queue insertion). `src/modules/operations/outbound-delivery-queue.ts` currently only enqueues encrypted messages with an idempotency key and checks suppression at enqueue time. `src/db/schema/db10-outbound-messages.draft.ts` has fencing and delivery fields but is *not part of the registered schema*. There is no production sender. These probes **remain NOT_RUN**.

## Committed deliverables

- `docs/planning/sql/db10-outbound-dispatch-lease-candidate.sql`: four **unregistered** PostgreSQL functions for atomic pending/retry row claims; late suppression and deadline checks before provider calls; fenced provider-accept/retry/failure updates; and expiry of only never-claimed, unsent records. The draft explicitly revokes the default `PUBLIC EXECUTE` grant on all four functions. W01 must apply explicit narrowly scoped grants when registering.
- `tests/db067-outbound-dispatch-contract.test.mjs`: 13 runnable Node `node:test` cases for source structure, claim fences, worker auth shape, no unsafe automatic reclaim, suppression checks and mutation witnesses. **Authored tests do not imply tests ran**.
- This integration contract: source-backed invariants, known limits, and exact acceptance scenarios.

### Lifecycle contract

| Operation | Required precondition | Safe database result | Explicitly excluded |
| --- | --- | --- | --- |
| Claim | `PENDING` or `RETRY`; due and not expired; attempts fewer than five; no provider acceptance | Competing workers use `FOR UPDATE SKIP LOCKED`; one current `CLAIMED` owner, bounded lease and incremented `claim_fence` / attempts | Reclaiming a timed-out `CLAIMED` row |
| Pre-send | Exact message ID, worker ID and claim fence; live lease | Recheck tenant/organization suppression and, for EMAIL, separately keyed **global** suppression; mark `SUPPRESSED` or `EXPIRED` and drop claim; otherwise return true | Raw emails, plaintext invitation URLs or unkeyed recipient digests |
| Complete | Exact current worker, fence, live lease, known provider result | Definitive provider acceptance saves provider ID/time; definitive **non-send** rejection can retry with bounded future time and sanitized reason, or terminally fail | Retrying an ambiguous timeout or uncertain provider outcome |
| Expire | Only expired `PENDING`/`RETRY` rows | Terminal `EXPIRED`; never resurrect a possibly sent `CLAIMED` row | Claiming already accepted or delivered messages |

### Critical conditions / honest limits

1. **Not exactly-once transport.** Database locks/idempotency cannot make an external provider call and a PostgreSQL transaction atomic. If the worker times out after the provider may have accepted the send, the row **must remain quarantined `CLAIMED`** until trusted provider idempotency/reconciliation establishes its actual outcome. Automatic lease-expiry reclaim could send duplicates. This draft intentionally favors fail-closed at-most-once handoff over unverified liveness.
2. **Late opt-out race is narrowed, not eliminated.** The final sender must derive `globalEmailHash` with `deriveGlobalEmailSuppressionHash` from the decrypted canonical EMAIL recipient using the separate stable secret, then call the pre-send guard **immediately before** provider handoff. An unsubscribe that commits after that check but before the provider call remains a cross-system race; policy/transport coordination is needed for stronger guarantees.
3. **Pre-send call is not yet enforced by a runtime sender.** An accidentally programmed worker could call an external provider without using these functions. The subsequent API/release phase must enforce the order and add executed tests. Do not claim P5-R09/P5-R21 verified merely because this SQL is staged.
4. **Privileges are part of correctness.** PostgreSQL creates functions executable by PUBLIC by default. This draft revokes PUBLIC on all four. W01 must grant only to a trusted dispatcher DB role; do not grant these functions to unauthenticated/API browser/ordinary college principals. The writer must never log decrypted message data or provider payloads.
5. **Source-safe TTL and retries.** `not_before`, `next_attempt_at`, `expires_at`, max-five attempts, non-null bounded lease, and monotonic claim fence are all enforced in the draft. Null/invalid worker, batch or lease input rejects. `FAILED`/retry failure codes must be allowlisted uppercase machine codes, never arbitrary provider text. Unknown provider status must never be converted to `RETRY`.
6. **The DB10 draft tables and these functions are not migrated.** `DB10_OUTBOUND_READY=DB10_VERIFIED` remains an operator-controlled fail-closed feature flag. Existing `outbound_messages` constraints, suppression uniqueness, global-HMAC secret separation and cross-college FK checks still need combined verification.
7. **No legacy data migration.** This is greenfield vNext source parity, not backfilling legacy notification data.

## Disposable PostgreSQL acceptance matrix — required, NOT_RUN

| Witness | Setup and action | Expected |
| --- | --- | --- |
| DB067-01 | Two sessions claim the same one due pending ID concurrently | Exactly one claim result, one owner, one incremented fence |
| DB067-02 | Return old fence or wrong worker against live claim | Pre-send and completion both false, row unchanged |
| DB067-03 | Attempt to reclaim expired `CLAIMED` after simulated provider timeout | No automatic claim; quarantine for external reconciliation |
| DB067-04 | Create tenant-scoped suppression after enqueue but before pre-send | Pre-send false, `SUPPRESSED`, zero provider invocations |
| DB067-05 | Create **global** EMAIL suppression in a different organization after enqueue | Same suppression result; no sender bypass using tenant-only hash |
| DB067-06 | Pass NULL, nonhex or mismatched global email hash | Fail closed; no authorized provider send |
| DB067-07 | Advance to `expires_at` while `CLAIMED` before pre-send | `EXPIRED`, claim cleared, no send |
| DB067-08 | Definitive provider non-send failure, retries fewer than five and due future | `RETRY`, future re-claim increments fence and attempts |
| DB067-09 | Attempt sixth claim/retry or retry after `expires_at` | Rejected / not eligible |
| DB067-10 | Simulate accepted provider result | `PROVIDER_ACCEPTED`, provider ID/time set, never reclaimed |
| DB067-11 | Simulate stale result after another valid fence transition | Stale result false; current state preserved |
| DB067-12 | Try `PUBLIC`/ordinary-tenant role calling every function | Permission denied |
| DB067-13 | Mutate `PENDING`, `RETRY`, `CLAIMED`, `SUPPRESSED` and late opt-out across crashes | No inappropriate state reversal, no second provider send |
| DB067-14 | Race unsubscribe immediately after pre-send but before provider call | Record observed residual; require explicit product/transport policy before declaring strict suppression guarantee |

**Integration prerequisites:** Chat 1 single-writer Drizzle migration + schema-barrel registration, source/drift review of `db10-outbound-messages.draft.ts`, exact function grants, atomic claim/callback implementation in a trusted provider worker, independent disposable PostgreSQL negative/race witnesses, full retry/provider-idempotency contract, and source-vs-runtime regression. No GitHub Actions runner is required; the CI billing pause is not a blocker to these independent checks.

**Verification accounting:** source guard file authored (13 Node cases); SQL functions 4 staged; PostgreSQL cases executed **0**; external provider calls **0**; live runtime claims verified **0**; P5-R09/P5-R21 **not closed**. Do not mark DATABASE certified.
