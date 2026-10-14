# Chat-9 — College Admin people/operations contributions

This document records implementation scope only, not closure or release approval. Master matrix and tracker are orchestrator-owned.

## Item 1 — Combined People directory filters — PARTIAL (2026-10-14)

- Before: /college/people only paged all roles together, without any searchable or status/role filter.
- After: persisted own-college memberships filtered by name/email/phone, exact membership role and lifecycle status before paginated counts; own-college authorization remains at service boundary; mobile filter layout, errors and loading states.
- Tests authored: college-people-directory-model.test.ts; college-people-directory-filters.test.ts (isolated PostgreSQL guarded; positive/foreign/wrong-role). Read-only path has no optimistic write token.
- Remaining: original legacy profile/modal equivalence, browser at mobile+desktop, executed unit/PG/type/lint acceptance. No DONE claims. No external sending, draft tables, or chat-3 academic files touched.

## Item 2 — Faculty onboarding — PARTIAL (2026-10-14)

- Dedicated Add faculty modal on /college/faculty reuses canonical, permission-checked and audited onboarding. Locks submitted role to FACULTY regardless of local checkbox state; deliberately does not send external invitations.
- Authored pure-role model/unit test and isolated PostgreSQL create, audit, foreign-college and wrong-role denial tests. No mutation optimistic token: onboarding creates canonical membership and uses collision/idempotency fences instead.
- Remaining: exact legacy invite/email delivery contract, extended Faculty profile editing, executed PG/unit/type/lint/browser evidence; no DONE claims.

## Item 3 — Study Group atomic Remove & Lock — PARTIAL (2026-10-14)

- Before: two separate Remove and Lock requests could leave a removed member unlocked on a partial failure.
- After: strict version-token + confirmation POST drives one row-locked transaction changing state REMOVED+isLocked, preserving group member history and immutable activity audit, with existing FIFO eligible waitlist promotion. Admin detail exposes a single confirmed action; same-origin route reused.
- Authored pure-model/unit and isolated-PG success, stale, foreign-college non-leaking and wrong-role tests. Remaining legacy rule forms, manual waitlist moderation, full roster pagination, executed quality/browser gates.

## Item 4 — Filtered People CSV report — PARTIAL (2026-10-14)

New College Admin-only bounded CSV of persisted, filtered memberships. Tenant-scoped service with 1,000-row limit, formula neutralization, truncation disclosure and private UID exclusion. Model/isolated PG positive and denial tests authored, not executed. Remaining: precise legacy report parity, bulk consistency and runtime/browser proof. Also fixed Item 3 stale-version test to use a positive nonmatching version instead of a Zod-invalid zero.

### Item 3 follow-up correction (2026-10-14)

Registered lms_group_members.version starts at zero. Remove & Lock now permits optimistic token version 0 and rejects negative versions; the unit witness covers this initial-version case. No acceptance tests were executed in this session.
