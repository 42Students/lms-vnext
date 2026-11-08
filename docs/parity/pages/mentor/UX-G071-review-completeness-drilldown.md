# UX-G071 — Mentor delivery review completeness drilldown

Status: **DOING — scoped implementation; not group accepted**.

## Source implementation

- Persisted final-delivery version rows now expose an accessible **View version details** link, routed by both authorized project and persisted submission IDs to the existing read-only review page.
- Invalid review pagination keeps the mentor on the same project through a **Clear invalid filters** recovery link instead of discarding the project context.
- Delivery details now include an **All delivery versions** return link to preserve navigation context.
- All five route loading states expose `aria-busy` and a named loading region, including closeout, resources and review completeness.
- Existing mentor project authorization and the destination's role/tenant checks remain unchanged; no new write path or storage access.
- Added six focused unit/source assertions for link generation, ID encoding, discoverable labels, invalid query recovery, five accessible loading states, and version-list roundtrip navigation.

## Required before group DONE

1. Execute focused Vitest, scoped ESLint and TypeScript checks against the implementation SHA.
2. Authenticate an assigned Mentor and verify version list → detail → review overview on 1280x800 desktop and 390x844 mobile (including focus and back navigation); capture artifacts.
3. Test unauthorized mentor, other tenant/project, malformed IDs and disabled module, proving no cross-tenant leakage.
4. Check all 15 G071 source surfaces and full closeout, meeting notes, resource directory and delivery review workflows. These have **not** been accepted by this narrow change.

## 8 November 2026 — five-route real Mentor responsive acceptance

- [New Chromium spec c2e12cb2](https://github.com/42Students/lms-vnext/commit/c2e12cb250c3f490f8998c0aa7b0b2e5a5370758) tests the persisted college-A Mentor project at 1280×800 and 390×844: actual closeout checklist, empty delivery history, empty resource directory, malformed pagination recovery on the same project, missing delivery/meeting details and an independently signed-in Learner's denial to all five page families. [Redirect-status correction 8ecbf865](https://github.com/42Students/lms-vnext/commit/8ecbf8656c95314e2a4a000c82e17d6f453bf4e5) prevents the browser client from following denial redirects and mistaking an unrelated landing page for a successful authorized response.
- [Dedicated PostgreSQL + Chromium workflow 42496051583](https://github.com/42Students/lms-vnext/actions/runs/42496051583) uses an isolated assigned Mentor fixture, development-only test identity, exact-trigger SHA, scoped ESLint/TypeScript and existing G071 units. Desktop/mobile screenshots and traces are uploaded. The run was **pending when documented**.
- This strengthens empty, invalid-query, authorization and responsive journeys, but does **not** yet establish real persisted submission-version details or meeting note creation/review. Source/loading/error and authenticated positive detail acceptance is still required; **DOING remains**.
