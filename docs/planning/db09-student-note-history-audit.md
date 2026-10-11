# DB-063 — TPO student-note history integrity

**Date:** 2026-10-11 IST  
**Worker:** Chat 3  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

Legacy `TpoStudentsReadService` lists student notes and creates them through `addNote` / `bulkNote`; no source mutation or delete path exists. Notes therefore function as placement-cell history, not an editable profile field.

The staged DB09 table already validates learner/author tenant-role scope and nonblank length. DB-063 adds a lifecycle guard:

- INSERT is allowed when `created_at` is not materially future-dated;
- UPDATE is rejected;
- DELETE is rejected.

This protects actor, learner, note text and timestamp from direct-SQL history rewriting.

PostgreSQL acceptance after migration registration must prove valid insert succeeds; future-dated insert fails; any UPDATE/DELETE fails; wrong-tenant/non-learner subject and unauthorized author continue to fail through the pre-existing principal guard.

**Gate:** source/staged implementation only; no migration or PostgreSQL execution claimed.
