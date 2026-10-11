# DB-056 — DB09 college-wide principal guard audit

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Global phase:** DATABASE  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Finding

The staged DB09 helper `db09_has_active_tpo_actor` was broader than canonical vNext authorization.

Canonical `placements.manage` permits an active same-college actor with persisted membership role `TPO` or `COLLEGE_ADMIN` (plus the separately-scoped super-admin path at the application layer). It does **not** treat an ordinary faculty membership or a DB09 team row as equivalent.

Before DB-056, the staged SQL helper accepted either:

- membership role `TPO|COLLEGE_ADMIN`; **or**
- `placement_tpo_team_members.role IN ('TPO_ADMIN','FACULTY_COORDINATOR')`.

That second branch was unsafe as a college-wide database primitive. The frozen legacy `TpoTeamService` explicitly defines `FACULTY_COORDINATOR` as department-limited. Reusing that role as a blanket TPO principal would allow direct-SQL writes that the canonical runtime permission model rejects, including college-wide collaboration objects guarded by `db09_has_active_tpo_actor`.

## Fix

`db09_has_active_tpo_actor` now requires a persisted active same-college membership with role `TPO` or `COLLEGE_ADMIN`. A `placement_tpo_team_members` row does not widen that authority.

This helper is intentionally used for college-wide DB09 collaboration mutations such as:

- TPO-authored message sender validation;
- secure share-link creator validation;
- TPO user preference / saved-view ownership;
- student-note author validation.

Future support for department-scoped faculty coordinators must use a **separate operation-specific guard** that proves department/job/applicant scope. It must not broaden the college-wide helper.

## Why not grant team TPO_ADMIN globally here?

The current canonical application permission matrix has no `placement_tpo_team_members` override for `placements.manage`; only persisted TPO/COLLEGE_ADMIN membership roles qualify. A database trigger should not authorize more actors than the canonical mutation path. If product/API policy later deliberately promotes team-based TPO administration, that must be an explicit cross-layer change with its own tests.

## Required acceptance evidence

Static/source regression must prove:

1. canonical `placements.manage` remains TPO/COLLEGE_ADMIN only;
2. the body of `db09_has_active_tpo_actor` does not reference `placement_tpo_team_members`;
3. the helper explicitly checks `TPO|COLLEGE_ADMIN`;
4. college-wide message/share/preferences/views/student-note guards call that helper;
5. comments preserve the department-scoped coordinator non-equivalence.

PostgreSQL verification, once the staged SQL is registered, must prove:

- active FACULTY membership + FACULTY_COORDINATOR team row cannot forge a college-wide TPO collaboration write;
- active TPO and COLLEGE_ADMIN memberships can satisfy the intended guard;
- inactive membership/user/college still fails;
- future coordinator-specific operations cannot escape their department/job scope.

**Gate:** source/staged implementation only. No registered migration or PostgreSQL pass is claimed by DB-056.
