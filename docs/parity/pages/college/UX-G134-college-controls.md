# UX-G134 · College interactive controls — scoped acceptance

**Status:** DONE on 2026-11-08 for the registered group. Does not certify global app shell hydration, release, or independent security signoff.

## Covered source
The canonical UX group contains 15 College component files for college-admin profile, department insights, faculty assignment/import/reassign, offering metadata, person audit/overview/edit, role directory, student CSV/history/register and shared confirmation.

## Source and executed evidence
- **Pinned source commit:** [`e5b2fbcf2c10ee8a07d58f6aeab1a961d49b9eb7`](https://github.com/42Students/lms-vnext/commit/e5b2fbcf2c10ee8a07d58f6aeab1a961d49b9eb7).
- **Successful workflow:** [run 42464612271](https://github.com/42Students/lms-vnext/actions/runs/42464612271). Exact checkout SHA check, scoped ESLint, full TypeScript, six UX regression unit tests, seeded PostgreSQL and ephemeral browser identities all passed.
- **Real authenticated Chromium:** 11/11 scenarios passed; desktop **1280×800** and mobile **390×844** covered student registration, faculty assignment, college profile and people directory (eight responsive checks), required-field recovery, learner denial for college-admin profile, and learner denial of college-wide CSV export (HTTP 403). No role checks were bypassed.
- **Screenshots and test evidence:** [artifact 13610987242](https://github.com/42Students/lms-vnext/actions/runs/42464612271/artifacts/13610987242).
- **Source drift:** comparing pinned source commit with `main` at `8d721b144ab359684f643a19e517175e24f9ed02` found **zero modifications among all 15 registered group source files**.

## Design and safety outcomes
- Mutation-side double-submit protection reviewed for bulk faculty assignment, student registration and profile saves.
- User-visible error copies avoid exposing raw API/private error internals in audit, person profile, faculty reassign, schedule reassign and offering metadata interfaces.
- Real college and learner sessions established boundary behavior and responsive layout. No authorization/RLS/tenant restrictions were relaxed by the group work.

## Separate follow-up / not certified here
- The browser job reported a **legacy shared topbar hydration warning**. The scoped assertions and workflow still passed; this needs its own global-shell hydration review and should not be represented as solved by UX-G134.
- The group-level accepted regression exercises representative critical workflows; this is not a claim that every possible minor interaction across all 15 components was independently exhaustively browser-tested.
