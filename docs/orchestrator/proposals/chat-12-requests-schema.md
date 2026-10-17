# Chat-12 proposal: missing request schema and recruiter drive review workflow

Status: **proposal only**, no DDL or production migration committed. Owner decisions are already resolved in `docs/audit/owner-decisions-resolved.md`.

## TPO-requests-verification-01 (S1) — Learner request kinds

The current placement learner request table, Zod contracts, and `tpo-global-requests-model.ts` recognize only `APPLICATION_WITHDRAWAL`, `ROUND_RESCHEDULE` and `OFFER_EXTENSION`. Legacy needs off-campus offer, registration change, absence dispute, correction with proof and placement after placement, with an independently validated payload per kind. Ask the orchestrator to stage a migration that extends the database enum/check constraint without touching existing requests or reinterpreting existing kinds. Specify payload data storage with web-URL-only proof, college-scoped review, duplicate-pending prevention, and audit/notification semantics. Implement service effects transactionally: external offer verification, registration choice change, absence dispute outcome, corrected academic field with proof review, and post-placement eligibility, with specific per-kind refusal paths and rollback on error. Never approve a kind by recording status only.

## TPO-requests-verification-37 and -38 (S2) — Recruiter drive review

Current drive job lifecycle lacks an institutional `REQUEST` state with recruiter decision and audit metadata. Proposal: add a distinct recruiter request submission channel and `REQUEST/SENT_BACK/REJECTED` lifecycle, with requests tab/list counts, college approval setting default on, verified trusted-company/domain exception rules, and recorded reasons for every auto-approval. Only then add TPO request bells, recruiter decision email templates, and approval/change-request history. Protect all notifications by persisted state transitions, college scope and idempotency keys. No email should be sent from a draft-created-as-request surrogate.

## Validation required after migration

Write gap-ID named tests for eligibility/scope, old data backfill compatibility, request-kind payload discriminants, concurrent decisions, partial failure rollback, duplicate submission, duplicate email/bell suppression, and recruiter/learner notification recipients. Live acceptance belongs to the orchestrator, not this builder.
