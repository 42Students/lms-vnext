# chat-9 — /admin last third UX rollout handoff

**Source implementation:** complete for route positions **75–111** of `docs/orchestrator/ui-ux/pages-admin.md` (37/37). **Executed acceptance:** pending; do not tick the route checklist until tests and device evidence are confirmed.

## Deliverables

- 37 of 37 route-specific notes in `docs/audit/ux/admin-*.md`.
- 37 initial `UX-admin-<route>-01` source tests in `tests/unit/ux-admin-chat9-batch-01..04.test.ts`.
- 14 route-specific bounded loading changes and `UX-admin-<route>-02` tests in `tests/unit/ux-admin-chat9-loading-a.test.ts` and `-b.test.ts`; each uses shared `GracefulPageLoading` with a slow-load retry and preserves its previous text.
- Seven focused interaction regressions in `tests/unit/ux-admin-chat9-interactions.test.ts`, covering semesters, platform settings, shortlisted detail, placement lookup, tenants, global template directory and template-college availability. Total 58 authored named source tests across seven files.
- Shared responsive `DataTable` (explicit `empty` copy and always-visible phone actions) for Semester directory; same for student placement lookup. Shared `Input`, `Select`, `Button`, `Pagination` for tenant, template and semester listing filters. Accessible scope-denied search, target/focus repairs, and route-owned 320px containment.
- Redirect routes retain their canonical authorization and destination; routes rendered by existing shared project, template or content components were not duplicated.
- Exact legacy titles, tab order, messages, permissions, filters and export actions preserved.

## Acceptance boundary and next action

All 37 route files and 37 audit notes are present. Source-only verification of route file presence, no remaining route-local `text-primary-text` or `min-h-10`, all 14 bounded loading surfaces, and all 58 named test cases was performed through GitHub file inspection.

**Not executed or certified here:** `npm run typecheck`, `npm run lint`, `npm run ux:guard`, `npm run ux:audit:source`, `npm run ux:audit:unit`, the focused Vitest suites, 320/360/390px browser checks, keyboard/AT and screenshot evidence. No GitHub Actions run was available for this lane's branch at the time of verification. Run those on the same SHA, fix any findings, then tick routes individually. Do not call this independent sign-off.
