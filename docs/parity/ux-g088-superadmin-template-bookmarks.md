# UX-G088 — Super Admin legacy project template URLs

Owner: `chat-ux-superadmin-templates-2026-11-07` · branch: `main` · 2026-11-07.

## Inventory and observed defect

Legacy routes:
- `/superadmin/projects/templates`: index → canonical `/admin/projects/templates`.
- `/superadmin/projects/templates/[templateId]`: persisted UUID, slug or a migrated numeric bookmark → scoped canonical detail only after a unique database match.
- `/superadmin/projects/templates/[templateId]/overview`: same validated detail.
- `/superadmin/projects/templates/new`: **previously mistaken for a template token** by the generic detail resolver, often resulting in a not-found page. Creating a project template was not reachable through the old bookmark.

## Implemented behavior

The legacy catch-all page `src/app/(authenticated)/superadmin/[...legacy]/page.tsx` now detects the literal `new` action before template lookups, checks `project-template.manage` against the trusted current Super Admin context, and routes to the canonical `/admin/projects/templates/new`. It does not copy tab/view/version parameters into the new form. Unknown template bookmarks still use safe mapping or a clear existing "No template in this link" recovery with a directory backlink. The canonical new form and its server role checks were not changed.

## Required acceptance

- `tests/unit/ux-g088-legacy-template-routing.test.tsx`: direct page tests for index, create, permission denial, non-Super Admin, valid existing UUID, allowlisted harmless query state, missing migrated numeric token and traversal/unsupported subroutes.
- `tests/ux-g088-template-contract.test.mjs`: source invariants for create action, read/grant permission, unique database token crosswalk, canonical destination, and absence of mutations.
- Existing `tests/unit/chat13-legacy-superadmin-bookmarks.test.ts` remains green.
- `tests/e2e/ux-g088-superadmin-template-bookmarks.spec.ts`: desktop and 320px mobile anonymous routes do not expose template management and reach actual responsive sign-in instead; screenshot evidence.
- Dedicated exact-SHA workflow: `.github/workflows/ux-superadmin-template-bookmarks-acceptance.yml`.

## Security and regression review

No client-provided template, collegeId or return URL is trusted as authorization. Non-Super Admin access still falls back to dashboard; old template UUID/slug/numeric IDs are looked up and rejected on zero/ambiguous matches. New action requires stronger manage permission; full authorization, RLS and record modification stay behind the modern template services. Other Super Admin legacy navigation is unchanged.

Engineering UX accepted `DONE` on 2026-11-08 after executed routing and browser checks; global release/security gates remain independent.


## Execution evidence and pending closure gate — 2026-11-07

- Implementation commits: `1b6a7373822b9f8308bd5682e2ae06ae1fb30d92` (map `/new` with `project-template.manage`) and `17deaed2afd1423238b229c311ccdc2483bb457a` (reject `/new/overview`, `/NEW/colleges` rather than treating `new` as a slug).
- Tests committed: `tests/unit/ux-g088-legacy-template-routing.test.tsx`, `tests/ux-g088-template-contract.test.mjs`, `tests/e2e/ux-g088-superadmin-template-bookmarks.spec.ts`.
- GitHub Actions initially rejected the bracketed `src/app/(authenticated)/superadmin/[...legacy]/page.tsx` trigger glob before running jobs. Workflow corrected to a valid scoped `src/app/**/superadmin/**` trigger (latest workflow commit `721a520b48dc4dad581914d851db376035fe4ffa`); GitHub now recognizes named `UX-G088 legacy template bookmarks acceptance` jobs.
- An actual direct 13/13 source-contract check of the live repo passed, covering route shape, manage/read permission, safe unique UUID/numeric lookup, invalid subroutes, Super Admin identity, bounded harmless query parameters and college scope. This is **not** equivalent to completed Vitest/Playwright.
- [Exact-SHA acceptance run 42394593599](https://github.com/42Students/lms-vnext/actions/runs/42394593599) is queued for the latest source/test change `2b9d7857dfd0b744d290ee8f43b4908ebd2463c8`. Do not mark DONE without successful lint/negative and positive unit cases, desktop/mobile browser proof and screenshot inspection.
- All earlier immediate failures were workflow configuration failures with no executed jobs; they are not counted as test failures or as passing evidence.

**UX-G088 is DONE after acceptance run 42458903109.**

## Final exact-source acceptance — 8 November 2026

- [GitHub Actions run 42458903109](https://github.com/42Students/lms-vnext/actions/runs/42458903109), checkout `1517df148dfd500d8721288ce08abde0826c7d6b`, completed **success**: ESLint, 3/3 Node source-contract tests, 10/10 Vitest existing+new positive/negative SSR tests, 2/2 Chromium browser scenarios (1280px desktop, 320px mobile) and screenshots.
- [Browser artifact 13608148980](https://github.com/42Students/lms-vnext/actions/runs/42458903109/artifacts/13608148980) documents anonymous denial and responsive sign-in, including no visible template-management controls.
- The legacy `/overview` bookmark intentionally resolves to the canonical template detail, while `/new` resolves to canonical protected template creation. Earlier browser tests incorrectly expected the old route to survive the redirect. The corrected browser assertions require the exact internal canonical destination and reject external `return` destinations. Protected server side permission/read and missing-record controls remain intact.
- Scoped route unit tests verify permission denial/non-Super Admin, index, create, real UUID, numeric missing and unsupported routes. This group acceptance does not certify production deployment or other security phases.
