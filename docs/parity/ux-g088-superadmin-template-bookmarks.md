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
