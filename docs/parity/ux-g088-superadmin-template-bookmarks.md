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

Status remains `DOING` until actual CI, negative/positive tests, visual inspection and tracker evidence are green.


## Execution evidence and pending closure gate — 2026-11-07

- Implementation commits: `1b6a7373822b9f8308bd5682e2ae06ae1fb30d92` (map `/new` with `project-template.manage`) and `17deaed2afd1423238b229c311ccdc2483bb457a` (reject `/new/overview`, `/NEW/colleges` rather than treating `new` as a slug).
- Tests committed: `tests/unit/ux-g088-legacy-template-routing.test.tsx`, `tests/ux-g088-template-contract.test.mjs`, `tests/e2e/ux-g088-superadmin-template-bookmarks.spec.ts`.
- GitHub Actions initially rejected the bracketed `src/app/(authenticated)/superadmin/[...legacy]/page.tsx` trigger glob before running jobs. Workflow corrected to a valid scoped `src/app/**/superadmin/**` trigger (latest workflow commit `721a520b48dc4dad581914d851db376035fe4ffa`); GitHub now recognizes named `UX-G088 legacy template bookmarks acceptance` jobs.
- An actual direct 13/13 source-contract check of the live repo passed, covering route shape, manage/read permission, safe unique UUID/numeric lookup, invalid subroutes, Super Admin identity, bounded harmless query parameters and college scope. This is **not** equivalent to completed Vitest/Playwright.
- [Exact-SHA acceptance run 42394593599](https://github.com/42Students/lms-vnext/actions/runs/42394593599) is queued for the latest source/test change `2b9d7857dfd0b744d290ee8f43b4908ebd2463c8`. Do not mark DONE without successful lint/negative and positive unit cases, desktop/mobile browser proof and screenshot inspection.
- All earlier immediate failures were workflow configuration failures with no executed jobs; they are not counted as test failures or as passing evidence.

**UX-G088 remains DOING until this acceptance closes.**
