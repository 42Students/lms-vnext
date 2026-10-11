# DB-049 — notification-campaign publish-time authorization and concurrency

**Worker:** Chat 5 · **Global phase:** DATABASE · **Status:** STAGED_ONLY / POSTGRES_NOT_RUN
**Previous source contract:** DB-043 (`docs/planning/database-parity-db10-notification-campaign-contract.md`).
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`.
**Affected stage:** `scripts/sql/db10-notification-campaign-staging.sql`; this is **not** a registered migration or a deployed guarantee. Chat 1 remains the sole migration/barrel integrator.

## Adversarial finding

The DB-043 guard previously checked `notification_campaigns` targets only at INSERT or an audience/tenant column UPDATE. A campaign created for an ACTIVE personal recipient could remain SCHEDULED while that recipient's membership was suspended; a status-only update to PUBLISHING/PUBLISHED did **not** fire the trigger. An ordinary `EXISTS` check on a matching ACTIVE recipient row was not locked. A SECTION_COURSE campaign similarly checked the related active delivery with an unlocked EXISTS; ending a delivery or deactivating its offering could race the transaction.

A UUID FK to a user, section, course or offering does not establish *current authorization*. These gaps matter when a campaign is due hours/days after it was authored. No evidence suggests this gap was harmless; previously drafted SQL did not fail closed at publication.

## Implemented in the isolated DB-043 staging SQL

1. Preserve the existing one-table/one-function/one-trigger shape: no journal, schema-barrel, root-package or registered migration changes.
2. Trigger on UPDATE OF `status` in addition to existing ownership/audience fields. When moving to or rewriting PUBLISHING/PUBLISHED, rerun the complete scoped college, activity-event, creator and target guard. The canonical publisher still inserts each authorized receipt and marks PUBLISHED in the **same transaction**.
3. For `audience_scope='USER'`, use `PERFORM ... FOR SHARE OF m` on matching ACTIVE `college_memberships`. Membership suspension/delete/transfer must serialize against this current entitlement check.
4. For `SECTION_COURSE`, `PERFORM ... FOR SHARE OF cd, o` on the exact active course-section delivery and ACTIVE offering. A concurrent `ended_at` or status update cannot slip between the check and commit.
5. Preserve the ability to set FAILED/CANCELLED after a target is revoked. A status-only non-publish change to unchanged tenant/audience identity skips the recheck; **any change** to tenant/event/creator/audience/target fields still runs full guards.
6. Maintain the existing checked same-college parent chain for sections/courses and source events. Cross-tenant negative writes should still raise SQLSTATE 23514.
7. Never infer authorization for derived broadcast recipients from the campaign scope alone. The service must rederive actual audience roles/college/class eligibility immediately before publishing in the same transaction and recheck prior to any external delivery. A campaign target lock is not individual-recipient permission proof.
8. Avoid claiming that this SQL stage has been run or that a delayed status change is an actual notification send. `PUBLISHED` only means committed per-user in-app receipt projection.

## Concurrency and negative witness matrix — ALL NOT_RUN

| ID | Operation/attack | Required PostgreSQL observation |
| --- | --- | --- |
| DB49-01 | INSERT USER with member belonging to other college | 23514 rejection |
| DB49-02 | INSERT USER whose membership is SUSPENDED | 23514 rejection |
| DB49-03 | Schedule USER while ACTIVE, suspend before UPDATE status=PUBLISHING | 23514 rejection; zero new receipts |
| DB49-04 | Schedule USER while ACTIVE, suspend before UPDATE status=PUBLISHED | 23514 rejection; zero new receipts |
| DB49-05 | Tx A locks ACTIVE membership for UPDATE, Tx B publishes campaign | Tx B waits; after A suspends+commits, Tx B 23514, not stale publish |
| DB49-06 | Tx A publishes and holds SHARE lock, Tx B suspends membership | Tx B waits until Tx A commit/rollback; receipt inserted only with a valid publish-time entitlement |
| DB49-07 | Schedule SECTION_COURSE, end delivery before status=PUBLISHING | 23514 rejection |
| DB49-08 | Schedule SECTION_COURSE, deactivate offering before status=PUBLISHED | 23514 rejection |
| DB49-09 | Tx A updates delivery/offering to inactive, Tx B publishes | Tx B waits on FOR SHARE OF cd,o; post-wait predicate fails |
| DB49-10 | Publish SECTION_COURSE referencing a course offered in a different section | 23514 rejection |
| DB49-11 | Creator suspended after enqueue and attempt status=PUBLISHING | 23514 rejection or explicitly approved reassignment; no unauthorized publication |
| DB49-12 | Revoke USER membership, then cancel unchanged campaign via status-only UPDATE | CANCELLED cleanup succeeds; no receipts; guard doesn't hold obsolete authorization hostage |
| DB49-13 | Revoke USER membership, then attempt to change target_user_id or college_id while CANCELLED | Full guard runs; invalid scope rejected |
| DB49-14 | Two workers compete to claim one SCHEDULED campaign with optimistic version/fenced claim | Exactly one claims, one set of per-user receipts; no false PUBLISHED state. **Requires separate publisher/writer implementation and test.** |
| DB49-15 | Revoke one broadcast recipient's entitlement without changing a valid section-level campaign target | That recipient is excluded during producer transaction; **requires API recipient rederivation, not just DB49 trigger.** |
| DB49-16 | After publish, edit unrelated parent cohort/department or orphan a course delivery | DB10 publisher cannot infer permanent authorization; producer/parent-guard integrations must define and test cutover semantics |

## Verification contract

- The SQL remains **unregistered** in Drizzle. Chat 1 must integrate it with proper dependency ordering, check naming/collisions, and replay from empty disposable PostgreSQL.
- `tests/db10-campaign-publish-guard.test.mjs` contains authored Node **source-contract assertions**, not executed PostgreSQL race evidence.
- Required runtime suite uses at least two independent PostgreSQL connections/transactions and a deterministic wait/timeout to witness serialization (DB49-05, 06, 09), not just `EXPLAIN` or `FOR SHARE` source text.
- No GitHub Actions dependence: it is intentionally paused for billing. Run in an approved independent environment; log PostgreSQL version, commands, connection safety and exact migration/test commit SHA.
- Mark task `COMPLETED` when committed with assertions and this contract, **not `DONE_VERIFIED`**. Do not advance DATABASE → API until publisher and recipient-level integrity are actually proven.
