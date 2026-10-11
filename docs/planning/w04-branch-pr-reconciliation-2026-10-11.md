# W04 / Chat 4 — Branch and PR to main reconciliation

**Audit date:** 2026-10-11 (Asia/Kolkata)
**Repository:** `42Students/lms-vnext`
**Shared-main observation:** `61b855460a2a815d43533d54de291c7fef161531` (the six chats continue to move `main`)
**Scope:** Chat 4 / W04 DB08 Placement Execution; no writes to W01-owned `drizzle/**` or shared `src/db/schema/index.ts`.
**Outcome:** **No missing W04 branch/PR payload to merge; all checked sources are already on `main` or faithfully archived.** This is a Git-history/source-presence statement, NOT feature completeness, test success, or migration activation.

## Discovered W04-related refs (entire branch/PR list, paged)

| Ref | Latest historic tip / disposition | Integration decision |
| --- | --- | --- |
| `db08-main-integration-2026` | `99106b70354485306868683c8a1e1ea7e84b435a`; [PR #14](https://github.com/42Students/lms-vnext/pull/14), **merged** | Already imported into `main`; do not merge again |
| `db08-placement-parity-2026` | `a53c7c5a5e277d88958cde3bb63db94347b970cd`; predecessor work branch | Original DB08 A/B work present; do not overwrite newer main source |
| `db08-placement-policy-outcomes-2026` | `4541410bcc2eeb7e5c0e72c345833b017ce0096e`; [PR #9](https://github.com/42Students/lms-vnext/pull/9), **closed unmerged** | Incompatible duplicate placements schema; unique payload byte-identically retained in `docs/archive/db08-placement-policy-outcomes-2026/`; never bulk merge |

No other branch matching `db08`, `placement`, `w04`, or `chat4` was found in the complete GitHub branch listing; no W04 placement PR is open in the complete PR listing as of the audit.

**Important Git semantics:** all three historic branches show non-zero ahead counts relative to `main` because of independent/divergent histories and a squash merge. Ahead count is not evidence of missing files. Comparisons below use Git blob identities and source checks against the latest `main`.

## Original W04 A/B payload: 19/19 present

The 19 files imported via PR #14 are **all on `main`**:
- 16 have identical Git blob IDs to the integration branch.
- 3 have intentionally advanced in `main`:
  1. `docs/planning/database-parity-db08-execution.md`: original document preserved as entire prefix, newer W04 implementation checkpoints appended.
  2. `docs/planning/database-parity-db08-field-ledger.json`: retains all 18 legacy tables, 280 original source field records, and their UNVERIFIED status; candidate mapping detail has progressed. **0/280 fields are runtime semantically verified.**
  3. `src/modules/placements/batch-participation-service.ts`: original API/function contracts remain, with stricter ambiguity and inactive-section checks (not reverted).

Other direct-to-`main` W04 code, including DB08-C independent external offers, cohort target draft schema/policy, two-gate learner access, Drive Day coordinator integrity, applicant/coordinator role exclusion, deadline/application lock guards, offer lifecycle and read-only company facts, has been verified by source presence.

For explicit cross-chat continuity, the additional audit selected **33 representative W04-owned source/test/document paths: 33/33 present** on `main`. See `docs/planning/w04-placement-closure-checklist.md` for the detailed implementation/evidence ledger.

## Closed obsolete PR #9: 20/20 unique files preserved

Comparing the entire historic PR #9 branch's tracked file tree with `main`, precisely 20 original pathnames were not active `main` files. **All 20** match Git blob IDs at the archive path:
`docs/archive/db08-placement-policy-outcomes-2026/<original-path>`, with `.txt` suffix for archived TypeScript source and tests.

PR #9 included incompatible `placement-db08-lifecycle.ts` and `placement-saved-jobs.ts` models and an outdated season-driven source contract. The archive is intentional: **do not replace canonical `placement_batch_lifecycles`, `placement_batch_registrations`, `placement_external_offers`, or `placement_saved_jobs` with draft counterparts.** See `docs/planning/database-parity-db08-branch-reconciliation.md`.

## Outstanding release gates (NOT merged/activated work)

- W01 alone owns generating/replaying/validating canonical DB08 migrations, journal, schema barrel and tenant-consistent constraints. The latest seen numbered migration is `0042_db06_assessment_scope_hardening.sql`; this does NOT register the isolated W04 DB08 schema models.
- Existing staged SQL candidates, including cohort target guard, offer lifecycle, application paid-module and eligibility race protection, coordinator/applicant exclusion and external offers, are on `main` as **staging**, not executed migrations.
- Database replay, lint, typecheck, unit, integration, browser/E2E and W04 release tests must be independently executed and evidenced. This audit provides **zero new passing test evidence**. CI runner/billing failures must not be represented as test passes.
- Learner, TPO, HR, College Admin, Super Admin pages/modal/action parity and DB08 semantic field verification remain open. The product cannot be called DONE or 100% parity from a branch reconciliation.

**Action:** No missing code to cherry-pick, push or merge. This audit record is the only new commit required; preserve parallel-chat `main` changes and continue W04 release work in its assigned workstream.
