# vNext work status: done, in progress, left aside

Date: 2026-11-13. Compiled from the repo tracker, planning docs and earlier session notes. Figures with an "as of" date may have moved; `docs/tracker.json` is the source for security and UX numbers.

## 1. UI/UX (the largest open area)

- **Board** (`docs/tracker.json#uxReview`, `node scripts/ux-groups.mjs --summary`): 339 groups. 124 DONE, 45 DOING, 170 UNPICKED. On 2026-11-09 the 73 open groups were split into 224 smaller ones so each can be closed on its own (`docs/ux/atomic-repartition-2026-11-09.md`). Surface-weighted: 941 of 2,163 surfaces were in DONE groups right after the split. The note on the board says these are assigned coverage, not verified completions.
- **A group counts as DONE only with:** a commit, a parity document, passing tests, desktop and mobile Chromium proof on the exact code SHA, and a regression/security review.
- **Consistency program** (as of 2026-11-06): a ratchet (`npm run ux:consistency`) took violations from 9,000+ to 966 (604 CSS `!important`, 309 bare links and 47 bare buttons that need designed components, 6 hand-rolled skeletons). Left: a visual pass per role with `npm run ux:audit`.
- **Polish pass** (declutter, hierarchy, empty and loading states, real mobile layouts) was run across about 700 surfaces by the lanes in October and went to a verification round. Not signed off by a browser walk-through of every page.
- **Pixel parity with the old LMS:** baselines and comparison plan exist; the comparison is done by the ChatGPT lanes, not by hand.
- **Open product rules:** UI strings must match the old LMS exactly (new features may add new strings); mobile matters because there is a native app that can open pages in web views.
- **Known small UX items from the role-switching audit:** stale "Your code is on its way." banner on the account chooser; Mentor dashboard line "Your active roles share one landing page" for one role; generic message when a role is revoked mid-session; visible "Loading 42 LMS..." heading on first paint on several pages; the college switcher button shows only the college name.

## 2. Features built recently

- **Course coordinator** (this week): a college admin makes one of a course's teachers its coordinator; they manage the shared lessons, items, assignments and quizzes. Migration 0343 applied to dev, image `4ea11cfb` deployed. Left: click-through on dev (dev has no course data yet), and per-course vs per-offering grant confirmation. Details: `docs/planning/course-coordinator-plan.md`.
- **Role switching and shell:** audited topbar, sidebar and switcher for every role; fixes pushed (workspace-switch audit events, tighter rate limit, nav-route test, accessible switcher label). A 103-item checklist is in `docs/security/ROLE-SWITCHING-CHECKLIST.md`; about 40 items checked, the rest not yet.

## 3. Security hardening (as of 2026-11-08 to 11-12)

- 493 controls; 0 verified. VERIFIED needs an independent reviewer who has not been named, so the work is "implemented, unverified" rather than closed. Roughly 371 need review and 122 need the owner.
- Built: audit trail with hash chain, nonce-based CSP, anomaly tripwire, new-device event, admin-scope step-up with 4-hour cap, secret scan of the build, role matrix baseline.
- Open and needing the owner: Cloud SQL SSL enforcement (item 33, a cloud change), an independent reviewer, a non-personal security contact address for `security.txt`, uniform sign-in wording, secret rotations (GCP key and prod DB password sit in a local folder; the mail token was revoked). MFA and passkeys were deliberately deferred.
- Not built: dual approval for sensitive role changes, key versioning, data-subject flow, per-worker DB logins, image signing, audit-trail admin view.
- Per the owner's current instruction, further security work stays code-only.

## 4. Testing and build quality

- **CI** was green on 2026-11-08 (run 42457371919), then drifted red from the UX lane pushing constantly.
- **Known failing today, unchanged by recent work:** 49 unit tests in 35 files, and 12 source-text node tests (db05 group), all failing identically on the code from before this week.
- **Locked plan (Part F):** 100% coverage target with a written exclusion list, mutation testing on critical modules, every test type from unit to load, no production deploy unless all gates are green (`docs/planning/part-f-exhaustive-testing-plan.md`).
- **18-check tightening list** (`docs/planning/vnext-tightening-plan.md`): full type-checked build, real-Postgres tests for all SQL, page smoke per route and role, API contract tests, click-through browser tests, migration tests, deploy-script CI checks and post-deploy smoke with auto rollback. Mostly still to do.
- **Save-flow testing:** create, edit and submit flows as each role on a throwaway database; earlier capture only tested viewing.

## 5. Data and operations

- **NSRIT data migration** from the old LMS dev database into vNext dev: plan and ETL were set up in October. Status of the actual load is not confirmed in the repo notes I read; check `docs/migration/` before relying on it.
- **Deploy process:** images are built on GitHub Actions and pushed from the laptop, never Cloud Build. Dev currently runs `4ea11cfb`. Production is untouched and stays off limits.
- **Dev host oddity:** `testa.development.42lms.com` returns 404 for the sign-in API while the login page and the `vnext` host work.

## 6. Phase 2 and parity audits

- Phase 1 surface matrix was mostly closed (347 of 361 DONE as of mid-October). Phase 2 is a deep per-page audit of every old-LMS surface, modal and action, with gaps built in order of importance (plan in `docs/planning/phase-2-page-audit-plan.md`). Whether it ran to completion is not recorded in my notes.

## 7. Infrastructure and cost (new, see the decision record)

- Decision to stay on Postgres; Cloudflare for the edge first; free-tier managed Postgres only for dev and test. See `docs/decisions/2026-11-13-infrastructure-cost-and-database.md`.
- First checks to run: shared campus IP rate limits, pooling safety of the per-request college setting, a 3,000-student load test, bulk import at 10k rows.

## 8. Suggested order

1. Finish the three read-only checks and the load test (sizes the database, protects a 10k-student onboarding).
2. Walk through the coordinator screens on dev once a test course exists.
3. Keep closing UX groups in the atomic board, with a role-by-role visual pass.
4. Fix the shared-lane CI drift so the red tests are either repaired or removed from the gate.
5. Name an independent reviewer for security and decide the Cloud SQL SSL change.
6. Cloudflare firewall and Turnstile in front of the current setup.
