# DB-062 — Recruiter-private applicant note lifecycle

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Source contract

Legacy `RecruiterWorkspaceService.saveNote` treats a private applicant note as a recruiter-owned annotation on one application of one drive:

- recruiter/college/job/application identity is selected before the write;
- an existing row is updated only by replacing `rating` and `note`;
- rating is nullable or 1..5;
- note is nullable or <=1000 characters after trimming;
- if both rating and note are cleared, the row is deleted;
- the row is private to the recruiter who owns it.

Therefore reassignment of an existing row to a different recruiter, college, job or application is not a supported mutation.

## Staged correction

The existing DB09 scope trigger already proves the recruiter has a matching active grant and that job/application scope is valid. DB-062 adds a lifecycle guard that:

- requires created/updated timestamps not to be materially future-dated;
- requires `updated_at >= created_at`;
- makes id/recruiter/college/job/application/created-at immutable after insert;
- forbids `updated_at` regression;
- requires a rating/note content change to strictly advance `updated_at`;
- intentionally does **not** block DELETE, because source semantics delete the row when both private fields are cleared.

The table's existing unique recruiter+application constraint and content/rating checks remain authoritative.

## PostgreSQL witnesses required after registration

- valid insert succeeds;
- cross-college/job/application/recruiter identity remains rejected;
- identity reassignment on an existing note fails;
- created-at rewrite fails;
- content mutation without advancing updated-at fails;
- updated-at regression fails;
- updated-at before created-at fails;
- materially future-dated timestamps fail;
- valid rating/note mutation with advanced updated-at succeeds;
- DELETE succeeds and a later fresh insert remains possible for the same recruiter/application.

**Gate:** source/staged implementation only. No registered migration, runtime producer, Node test or PostgreSQL execution is claimed by DB-062.
