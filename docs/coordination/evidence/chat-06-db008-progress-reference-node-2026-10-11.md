# Chat 6 DB-008 — executed local reference-model evidence (2026-10-11)

**Exact repo file:** `tests/db05-progress-consumer-reference.test.mjs`  
**GitHub blob SHA:** `1d6dd100b35f77fed90b06acec6cd13a0fd42ba2`  
**Authored commit:** `3f5189f976439fbb73e702d11128609b3618f3b3`  
**Execution environment:** ephemeral ChatGPT container, Node.js `v22.16.0`  
**Command executed:** `node --test /tmp/db05-progress-consumer-reference.test.mjs`  
**Syntax check:** `node --check /tmp/db05-progress-consumer-reference.test.mjs` (exit 0)  
**Blob identity:** `git hash-object /tmp/db05-progress-consumer-reference.test.mjs` = `1d6dd100b35f77fed90b06acec6cd13a0fd42ba2`, **exactly matches** the GitHub `fetch_file` blob SHA.  
**Additional local SHA-256:** `a61c3cf3aac922243c7336b6ddccb6e2b82cd170741571e282d07d49c1959221`  
**Result:** `8 tests`, `8 pass`, `0 fail`, `exit code 0`, runtime `67.548475 ms` (TAP output from local process).

The eight passing cases were:

1. Latest incomplete attempt supersedes completed attempt history in admin counts.
2. Deleted latest attempt does not resurrect earlier completed attempt.
3. Multiple completed attempts count exactly one current completion.
4. Workspace returns one content row even with multiple progress attempts.
5. Retake starts a fresh attempt while preserving the earlier first-completion audit record.
6. Old browser tab save is rejected after attempt advance.
7. Separate membership/content state does not bleed together.
8. Duplicate composite key is rejected in the reference model.

**Do not overinterpret:** this is a **self-contained pure in-memory reference model**, not actual vNext API code or PostgreSQL SQL execution. The real consumer currently still has membership/content-only `.limit(1)`, unscoped atomic updates and a learner workspace join that duplicates rows after attempt expansion. These tests do **not** count toward PostgreSQL migration acceptance, API integration proof, full repo unit suite, or DONE_VERIFIED.

**CI:** GitHub Actions intentionally unused (billing); not treated as engineering blocker.  
**PostgreSQL:** unverified/unexecuted.  
**Shared phase:** remains DATABASE.  
**Task:** DB-008 remains IN_PROGRESS.

Consumer SQL and cutover handoff: `docs/planning/db05-progress-consumer-query-handoff.md`. The production service changes must occur when the coordinated schema/service cutover is executable and accepted.
