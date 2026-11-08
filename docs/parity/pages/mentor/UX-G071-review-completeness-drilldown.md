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
