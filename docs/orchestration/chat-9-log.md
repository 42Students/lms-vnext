# Chat-9 — College Admin people/operations contributions

This document records implementation scope only, not closure or release approval. Master matrix and tracker are orchestrator-owned.

## Item 1 — Combined People directory filters — PARTIAL (2026-10-14)

- Before: /college/people only paged all roles together, without any searchable or status/role filter.
- After: persisted own-college memberships filtered by name/email/phone, exact membership role and lifecycle status before paginated counts; own-college authorization remains at service boundary; mobile filter layout, errors and loading states.
- Tests authored: college-people-directory-model.test.ts; college-people-directory-filters.test.ts (isolated PostgreSQL guarded; positive/foreign/wrong-role). Read-only path has no optimistic write token.
- Remaining: original legacy profile/modal equivalence, browser at mobile+desktop, executed unit/PG/type/lint acceptance. No DONE claims. No external sending, draft tables, or chat-3 academic files touched.
