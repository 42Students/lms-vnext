# LMS vNext work consolidation onto main — 24 October 2026

This record distinguishes **commits already incorporated** from **stale branch-only work**. The owner's current direction is to implement in `main`; do not rewrite `main` with stale branch trees or claim that unexecuted tests passed.

## Confirmed in main

- All twenty historical `chatgpt/chat-1-b` through `chatgpt/chat-20-b` branch heads are ancestors of `main` (GitHub compare ahead-by = 0 as checked 2026-10-24). Their committed changes are already represented by main's history.
- The parallel Mentor lifecycle hardening from draft PR [#200](https://github.com/42Students/lms-vnext/pull/200) independently landed at [107e916](https://github.com/42Students/lms-vnext/commit/107e916ca13610783472c8e9887186bd32f52486). It checks project soft-deletion within locked Sprint start/reopen/task mutations and checks live release scope; the former isolated branch must not be merged over the newer implementation.
- Five PostgreSQL regression cases from that isolated Mentor branch were added directly to `main` at [cec491e](https://github.com/42Students/lms-vnext/commit/cec491e01d07a0a372200a93e7b886d1140290b8). They cover deleted-project start/sign-off/task/reopen denials and shipped/deleted parent release denials. Test **source is committed**; it has **not** been certified passing in this review.
- The Oct 23 prototype oracle draft PR [#199](https://github.com/42Students/lms-vnext/pull/199) is superseded by the longer, maintained `main` document `docs/prototypes/tpo-recruiter-mentor-parity.md`, including the Oct 24 owner override. PR #199 was closed without replacing newer screen-status evidence.
- The valid Recruiter round end-time validation logic from the old `chatgpt/chat-7` branch was adapted to current `main` in [8dd5b18](https://github.com/42Students/lms-vnext/commit/8dd5b18969723ec3d0635305f8dd119c52ea8d43) with the original regression test transferred in [fbab92f](https://github.com/42Students/lms-vnext/commit/fbab92f23ae70414749e1d7a52dc52304ebaefb6).

## Historical branches that are NOT safe to merge indiscriminately

| Source | GitHub comparison to current main | Disposition |
| --- | --- | --- |
| `chatgpt/chat-5` (Oct 16 TPO legacy work) | Diverged: 20 unique commits, ~59K main-side commits since common base | Requires modern TPO screen/service contract review. Main contains newer implementations of the drive export, deadlines, round reorder and other modules; the old `tpo-applicant-search` module expected by an old branch test is no longer present. No wholesale merge. |
| `chatgpt/chat-7` (Oct 16 Recruiter legacy work) | Diverged: 20 unique commits, ~59K main-side commits since common base | Modern Recruiter calendar/conversations were significantly reworked. The safe round-duration helper/test were ported; older conversation pulse and auto-read components are absent from main and must be evaluated against current explicit read-receipt policy before any adoption. No wholesale merge. |
| `work/remaining-2026-10-04` (PR #1) | Old divergent placement migration, >68K main-side commits since common base | Separate outdated placement work, not part of Mentor prototype pass. Open draft retained; needs a focused schema/service reconciliation before considering inclusion. |

## Rules for subsequent chats

1. Work against the fresh latest `main` file contents. Before adding a fix, check whether a parallel chat already landed its equivalent.
2. Port only behaviorally correct **remaining** code/test changes; do not overwrite newer `main` with whole-file versions from stale branches.
3. Run TypeScript, lint, unit, PostgreSQL and authenticated browser validation; a pending/cancelled run is not green. Keep acceptance separate from code-written counts.
4. Preserve the distinct 132-item Mentor functional code-closure ledger and the deferred visual gate; do not mark all 132 complete because branches have been reconciled.
5. If additional chat branches are created, move verified work promptly into `main` and close superseded PRs with traceable commit links.
