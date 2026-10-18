# HR source UX review — `/hr/placements`

- Page: `src/app/(authenticated)/hr/placements/page.tsx`; exact legacy route/title/actions, server permissions and data integrations retained.
- Observed UX concerns: horizontal scroll containment, 40px touch controls and nested main semantics where present.
- Source changes: Fluid min-width page surface.
- States: existing loading, empty, partial, failure, scope, and confirmation paths preserved; no fabricated data or client-only authorization.
- Regression: `UX-hr-hr-placements-01` in `tests/unit/ux-chat14-hr-02.test.ts`.
- QA: static source only; TypeScript, unit, keyboard and phone WebView audits to be run by orchestrator; inventory unticked.
