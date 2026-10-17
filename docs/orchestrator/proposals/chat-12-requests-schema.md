# Chat-12 proposal: missing request schema and recruiter drive review workflow

Status: **proposal only**, no DDL or production migration committed. Owner decisions are already resolved in `docs/audit/owner-decisions-resolved.md`.

## TPO-requests-verification-01 (S1) — Learner request kinds

The current placement learner request table, Zod contracts, and `tpo-global-requests-model.ts` recognize only `APPLICATION_WITHDRAWAL`, `ROUND_RESCHEDULE` and `OFFER_EXTENSION`. Legacy needs off-campus offer, registration change, absence dispute, correction with proof and placement after placement, with an independently validated payload per kind. Ask the orchestrator to stage a migration that extends the database enum/check constraint without touching existing requests or reinterpreting existing kinds. Specify payload data storage with web-URL-only proof, college-scoped review, duplicate-pending prevention, and audit/notification semantics. Implement service effects transactionally: external offer verification, registration choice change, absence dispute outcome, corrected academic field with proof review, and post-placement eligibility, with specific per-kind refusal paths and rollback on error. Never approve a kind by recording status only.

## TPO-requests-verification-37 and -38 (S2) — Recruiter drive review

Current drive job lifecycle lacks an institutional `REQUEST` state with recruiter decision and audit metadata. Proposal: add a distinct recruiter request submission channel and `REQUEST/SENT_BACK/REJECTED` lifecycle, with requests tab/list counts, college approval setting default on, verified trusted-company/domain exception rules, and recorded reasons for every auto-approval. Only then add TPO request bells, recruiter decision email templates, and approval/change-request history. Protect all notifications by persisted state transitions, college scope and idempotency keys. No email should be sent from a draft-created-as-request surrogate.

## Validation required after migration

Write gap-ID named tests for eligibility/scope, old data backfill compatibility, request-kind payload discriminants, concurrent decisions, partial failure rollback, duplicate submission, duplicate email/bell suppression, and recruiter/learner notification recipients. Live acceptance belongs to the orchestrator, not this builder.

## 2026-10-18 conflict resolution (chat-12)

**Decision:** The canonical contract is the first effective definition in registered migration 0134: `target_key varchar(150)`, `status varchar(20)`, JSON-object CHECK, composite `(membership_id,college_id)` FK, pending-target unique index, reviewer/time invariant and immutable events with 20-character status. The later `IF NOT EXISTS` definition does not replace this table. Its extra indexes are redundant but harmless.

The second proposal adds a useful sixth learner kind (`OFFER_ACCEPTANCE_DISPUTE`), which is added by **only** a new proposal-only kind CHECK in `docs/proposed-migrations/chat-12-0134-general-requests-correction.sql`. The 150-character target bound handles all supported identities; widening to text is unnecessary. The service inspects the live CHECK before attempting this sixth kind, otherwise gives a controlled unavailable error. Drizzle continues to model *the actually registered 0134* until the new DDL is approved; never edit 0134.

For `placement_tpo_prep_assignments`, the original 0134 `due_at NOT NULL`, composite membership FK, unique member/offering and due-after-created CHECK remain authoritative; optional legacy due dates need a separate migration/decision. Named source tests are authored; PostgreSQL tests are pending execution.
