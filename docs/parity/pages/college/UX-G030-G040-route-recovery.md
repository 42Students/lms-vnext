# College Admin UX-G030–G040 route recovery — partial evidence

Scope: UX-G030, G031, G032, G033, G034, G035, G037, G038, G039, G040 (ten groups). Work performed on main, source-only paths in the corresponding canonical `docs/tracker.json#uxReview.groups`.

## Implemented

- Error states maintain an accessible Retry button and a safe navigation alternative, instead of stranding College Admin users in failed directories, placement panels, elective allocations, faculty/people lists, or project workspaces.
- Nested project fallback screens now return to `/college/projects` rather than the global dashboard. Placement job and creation errors retain their placement parent; College Admin profile renders a safe College home fallback.
- Hall availability loading displays the schedule context and a parent-list backlink before the recovery skeleton.
- Real route error components are rendered by a synthetic opt-in development-only fixture, which remains a 404 in production. No mocked tenant identity or authentication bypass is deployed.
- Regression file checks the authorized College Admin role guard and 34+ safe failure routes. Playwright tests ten actual route error boundaries in both 390px/1280px layouts, focusable 44px mobile/36px desktop Retry controls, working reset callbacks, scoped destinations and learner denial of placement creation.

## Verification status

First exact-SHA run: [42475795831](https://github.com/42Students/lms-vnext/actions/runs/42475795831), **FAILED** in browser only. Scoped lint, full TypeScript, 12 focused Vitest cases, PostgreSQL bootstrap and seed passed. Browser revealed a test assertion incorrectly expecting a 44px button even at desktop `md:min-h-9` where 36px is designed, and one slow redirect from `waitUntil: commit`. Both tests were refined without relaxing the denied-role expectation; follow-up full acceptance is required. No green browser run is claimed yet.

## Still required for DONE

Review all 15–18 registered surfaces **per group**, not just errors: primary happy-path workflows, empty/loading/filtered/pagination states, dialogs/actions, mobile navigation, create/update/delete effect, producer→consumer and cross-college privacy checks. Obtain a clean exact-SHA successful browser and regression run. Keep all ten groups **DOING** until full scoped evidence is recorded on their individual tracker entries. This document is evidence, never a second status board.

## Additional course-progress error recovery witness — 8 November 2026

- The development-only rendered recovery fixture now includes the existing College course-progress error boundary in two states: an unknown exception with an intentionally sensitive synthetic message/digest, and a recognized metadata-filter failure. This expands coverage of the existing College route without creating a new user-facing page.
- Source commits: [fixture `35a24d88`](https://github.com/42Students/lms-vnext/commit/35a24d88d1801459ce0b8aef69f3965a60a36bd1) and [responsive Playwright checks `58448577`](https://github.com/42Students/lms-vnext/commit/58448577dc3160947a2a2c8ade92d7282ca8a878). Both 1280px and 390px browser variants now assert safe fallback labels, accessible Retry interactions, the recognized friendly filter message and absence of private exception text, digest or raw internal code in rendered UI.
- These commits are **authored evidence**, not proof of an executed green CI run. The affected G030–G040 groups remain **DOING** until a clean exact-SHA run plus the full group workflows, tenant/role negatives and responsive acceptance are independently recorded.

## 9 November 2026 targeted G030–G034 follow-up (source committed; group closure open)

Five production route improvements committed on main: G030 batches failed-period Retry gains a >=44px mobile target; G031 contacts Clear search gains a >=44px mobile target; G032 invalid course URL filters now display a warning and safe clear action instead of silently defaulting; G033 denied elective-allocation Back to electives action gains a >=44px mobile target; G034 empty study-group copy distinguishes study groups from elective/project teams while retaining the feature release gate.

Relevant source commits: `018a5c44b97679142f96b1572a6f425c827aad31` (G030), `1866892cb34379e3b4e8a8a570f37235a6773c7a` (G031), `a14789e6c348aab99350c963b360257ded0e6f84` (G032), `748fbd2fff6df750fbe6fdad5fd4b2ebdd398fbe` (G033), `d276da6169e94bb41d4e5318e595e8022e855a39` (G034). Source regression cases for all five are in `tests/unit/ux-ten-college-route-recovery.test.ts` at `42a84ad70744a356a9c2a532bf1fc63a37d654fd`. The responsive fallback browser suite now covers 320px/390px/1280px, with six required tests, and the scoped CI workflow watches these five production route paths.

Acceptance run at commit `d215c2a45c9c2ba1ecb358a1b9b70e63753b5b7b`: https://github.com/42Students/lms-vnext/actions/runs/42580106539 — **running at time of record; no green conclusion claimed**. No group has been reclassified from DOING. Remaining full acceptance must still cover each group's registered pages, loaded/empty/invalid/loading/error states, meaningful create/edit/bulk operations where applicable, actual authenticated role and cross-college denials, and responsive keyboard/browser evidence. G034's standalone study groups remain behind `COLLEGE_STUDY_GROUPS_RELEASED`, which is not bypassed by these changes.
