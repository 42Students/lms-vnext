# Chat 3 — audit of unmerged branches, PRs and direct-main work

**Date:** 2026-10-11 IST · **Repository:** `42Students/lms-vnext` · **Target:** `main`  
**Worker:** Chat 3 · **Global phase:** DATABASE

## GitHub inventory

All eight branches prefixed `chat3-db09-` were compared to the then-current `main` using GitHub's compare endpoint. Four open repository PRs were present (#84, #45, #41, #1), **none from these Chat 3 branches**; those PRs belong to other workstreams and were not merged in this audit.

| Chat 3 branch | Ahead of main in Git ancestry | Finding |
| --- | ---: | --- |
| `chat3-db09-final-disposition-20261011` | 0 | Fully in main history |
| `chat3-db09-integration-readiness-20261011` | 0 | Fully in main history |
| `chat3-db09-parent-keys-20261011` | 0 | Fully in main history |
| `chat3-db09-prep-refine-20261011` | 0 | Fully in main history |
| `chat3-db09-scheduling-20261011` | 0 | Fully in main history |
| `chat3-db09-settings-canonical-20261011` | 0 | Fully in main history |
| `chat3-db09-sql-executability-20261011` | 0 | Fully in main history |
| `chat3-db09-drive-group-integrity-20261011` | **5 commits** | Historical branch diverged and hundreds of commits behind; audited and **ported remaining safe behavior directly to main**, not branch-merged |

Historical DB09 branches without the `chat3-` worker prefix also exist and are far behind current main. Their ownership and integration status are governed by their separate workstream/PR history; no stale DB09 branch was force-merged.

## Five pending historical commit intents audited

Branch tip `33899c10aee1b62965d14843ce08694c3b579fe2`. Source commits:

1. `e952e95a` — require `placement_recruiter_profiles(user_id, company_id)` parent composite UNIQUE. **Already exists in main** `db09-parent-composite-keys-candidate.sql`.
2. `57c2851a` — bind group to recruiter/company, creator and scoped child jobs. **Main already has** composite FK, active grant and one child per group+college, with stronger canonical user/company/college active-state checks. A missing creator hardening detail was ported.
3. `83cf6bfe` — reject inactive owner on group creation. **Main already handles** active recruiter profile/company/user, immutable owner/company and child-scope checks; keep newer implementation.
4. `022228b2` — add migration-integrator and negative-witness handoff. **Reconciled** into the current DB09 integration manifest.
5. `33899c10` — static guard for drive-group integrity. **Main already had** related guards; extended the current regression tests rather than reintroducing old tests that conflict with current SQL ordering.

**Critical reason not to merge the old branch wholesale:** both the archived SQL and current staging file initially used an invalid bare single-dollar `LANGUAGE plpgsql AS $` / `END $;` delimiter in one function. Main's current job/group contract also includes additional state checks not in the old branch. Merging would risk reverting working source. User requested direct `main` pushes and no new PRs, so the audited improvements were committed to `main` as narrow CAS-safe commits. The old historical branch may still report *ahead by five* in Git ancestry because its original commits were intentionally **not merged**; this is not an assertion that its branch history is merged.

## New main commits from this audit

- `aa83c3f050a62db887fad6dd8d23c64d792be41e` — repaired the invalid PostgreSQL `$$` function delimiter, made drive-group creator non-null, enforced group owner = creator, and added a grouped job creator = owner check to the staged DB09 source.
- `d3078269b026a1b5afbc152efebb8504eb4260af` — extended the child job trigger to run on `created_by_user_id` updates, preventing the owner check from being bypassed by editing job provenance later.
- `f362140ebab8a9c0b59be0bcb705757376e056e0` — updated regression checks for the stricter creator invariant and valid SQL dollar quoting.
- `a7eb6f584250ebf66fa063d48bd32bfbcc32101b` — repaired an outdated, order-dependent test of the otherwise-valid active college/recruiter/company grant predicates; now tests each exact predicate independently.
- `ac68fa14a8c7f061ec7a115d4a89e165ea73cc97` — updated canonical DB09 migration handoff, actor provenance, and required PostgreSQL replay tests.

Legacy behavior source: `42Students/lms@prod-2026` `RecruiterPlanDriveService.planDrive/addCollege` creates grouped child jobs on behalf of the same recruiter identity. These changes are source-backed DB contract design, **not proof of integrated runtime**.

## Test execution and unresolved gates

Executed the **exact three affected committed test callbacks** from `tests/db09-integration-staging-guard.test.mjs` inside an isolated JavaScript evaluator against latest fetched GitHub source inputs: **3/3 passed** after correcting the pre-existing order-sensitive assertion. These used injected file-reading/assertion shims, not the Node test runner.

Not executed here: `node --test`, TypeScript typecheck, generated Drizzle migration, PostgreSQL migration replay or the adversarial tenant/concurrency witnesses. A staged SQL document is not a registered migration. GitHub Actions CI intentionally unused because of billing; this alone is not a blocker to engineering.

**Remaining integration responsibility:** Chat 1 registers and replays the canonical DB09 schema, then independent PostgreSQL verifies grant-revocation history, invalid company/recruiter pairs, null/forged creators, direct-SQL change to a grouped job's creator, and concurrent duplicates per group/college. Chat 3 DB-007 and DB-012 remain blocked/acceptance-open; DB-027/032/034/036 are source-implementation completed and **not DONE_VERIFIED**.

## Final judgment

No unmerged Chat 3 **PR** exists, and no outstanding unique drive-group rule from the five historical branch commits remains unaddressed in the current **source implementation**. The historical branch itself remains unmerged and should **not** be mechanically merged due to extreme drift; it is safe to archive later after formal verification. No unrelated open PR was modified.
