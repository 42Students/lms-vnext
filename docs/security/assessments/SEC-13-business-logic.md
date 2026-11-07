# SEC-13 application and business-logic security: assessment (2026-11-08)

Method: counted patterns in `src` (not a review of each workflow) plus the probes in `evidence/`. Counts are files containing the pattern, a signal of how widespread the practice is, not proof that every workflow uses it. Nothing VERIFIED.

| Control | Signal | Proposed state |
|---|---|---|
| 003, 004 server-side state machines | Services own the transitions (placements job and application statuses, project and task states, quiz attempts, offers); the browser never sets a state directly. Transition tables are not inventoried in one place | PARTIAL |
| 005, 006 duplicate and replayed mutations | 128 files use idempotency, dedupe or delivery keys (outbound messages, notifications, webhooks, uploads); unsafe mutations additionally carry `confirmed: true` in 93 files so a replayed or accidental request is refused | IMPLEMENTED_UNVERIFIED |
| 007, 008 races and concurrency control | `expectedUpdatedAt` optimistic checks in 181 files, version/stale checks in 282 files, `SELECT ... FOR UPDATE` or `FOR SHARE` in 347 files, advisory locks in 43 files (quiz attempt limits, sign-in send caps, skills selection, profile verification) | IMPLEMENTED_UNVERIFIED |
| 009, 010 self-approval and dual approval | Two explicit guards found by search; no dual approval for any administrative operation (Super Admin changes, role grants, exports are single-actor with step-up) | GAP: decide which operations need a second approver |
| 011, 012 historical and published records | Grade changes and overrides have history tables and audit rows in several modules (assignment grading history, placements status history); a general rule that published records are append-only is not enforced centrally | PARTIAL |
| 013 submission ownership and windows | Quiz attempt limit enforced under an advisory lock inside the transaction (checked); submission windows in services; same-college horizontal probe found no cross-learner reads | PARTIAL |
| 014 suspended or archived entities | Active-status checks appear in 175 service files and in context resolution (user, membership, college and organization must be ACTIVE on every request) | IMPLEMENTED_UNVERIFIED |
| 015 billing | No payment flow exists in vNext | NOT APPLICABLE |
| 016 bulk endpoints | Bulk and import routes sit behind step-up and `confirmed: true`, are rate limited per actor, and exports are audited and counted by the tripwire | PARTIAL |
| 017, 018 deterministic and deny-by-default | Policy functions are pure and unit tested (`platform-policy.test.ts`); inconsistent security state (a context with several roles, a Super Admin with a membership, an expired scope) resolves to no access | IMPLEMENTED_UNVERIFIED |
| 001, 002 threat models | None written beyond `central-security-architecture.md` and the assessments | GAP (workflow threat models for placements, assessments, exports) |

Owner decisions flagged: which administrative operations need a second approver (SEC-13-010).
