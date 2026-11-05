# SEC-18-002 — Required CI check enforcement witness

**Control:** SEC-18-002 — Require passing security and correctness checks before merging.
**Scope:** GitHub branch ruleset for `main` in `42Students/lms-vnext`.
**State:** Evidence in progress; **NOT VERIFIED**, **NOT release signoff**.
**Verification date:** 2026-11-05 UTC.
**Pull request:** https://github.com/42Students/lms-vnext/pull/227

## Ruleset configuration observed by repository owner

The owner-provided GitHub ruleset screenshots on 2026-11-05 show an **Active** ruleset targeting one branch, with required pull requests (one approval and stale-review dismissal), required checks, up-to-date branch condition, restriction on branch deletion, force-push blocking, and an empty bypass list. The nine required check contexts shown were:

- `lint`, `typecheck`, `unit`, `db00-scope`, `source-contracts`, `schema-drift`, `database`, `build`
- `Exact-source 493-control completeness, status and evidence`

This is **owner-supplied UI configuration evidence**, not a repository API ruleset dump. Target branch name and bypass semantics must still be independently reconfirmed before final acceptance.

## Executed negative witness: deliberately failed required security check

- Disposable branch: `security/sec-18-002-enforcement-proof-20261105`.
- Red commit: `adaa3a3995ff2e7c43ab4f40ee1b178b37892a7c`.
- PR-triggered workflow: https://github.com/42Students/lms-vnext/actions/runs/41994101617
- Failed job: `Exact-source 493-control completeness, status and evidence` (job ID `127133002508`).
- GitHub Actions job result: `completed / failure`.
- `Verify exact tracked commit`: passed.
- `Run adversarial canonical tracker invariants`: failed, intentionally.
- Log states `SEC-18-002 red-phase enforcement witness`: **not ok**; `# pass 18`, `# fail 1`; exit code 1.
- The deliberately failing test was confined to the disposable PR branch and was then removed in commit `674845917d9f2af2995f82b052cb95dd43d48014`. It was never added to `main`.

The available GitHub connector reports `mergeable` (conflict freedom) but does not expose a reliable ruleset evaluation/merge-block reason. **The failed required check alone does not independently prove that GitHub refused the merge. Do not claim the enforcement test fully passed without the blocked-merge UI or authoritative ruleset/merge-eligibility receipt.**

## Remaining acceptance

1. Capture authoritative active ruleset target branch `main`, all nine required contexts, enforcement/bypass configuration, and a **blocked merge** while the red required check is failing.
2. Verify the cleaned PR's **exact latest SHA** has green required checks; failed earlier commits do not qualify as a green receipt.
3. Obtain the configured one independent review/approval, and confirm the rule does not allow an unapproved PR to merge.
4. Have an independent reviewer check the evidence and deployed repository configuration; store review URL and release evidence with exact SHA in the canonical tracker.
5. Only then promote `SEC-18-002` to `VERIFIED`. `SEC-18-001` branch-protection requirement remains separately scoped.

No intentional failure, settings bypass, force push, unreviewed merge, or premature `VERIFIED` state is acceptable.
