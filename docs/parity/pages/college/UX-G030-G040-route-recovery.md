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
