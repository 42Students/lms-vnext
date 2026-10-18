# Chat-19 HR UX rollout handoff

- **Slice:** all 22 `/hr` routes, in `docs/orchestrator/ui-ux/pages-hr.md` order. Exclusive HR ownership; mentor untouched.
- **Source implementation:** 18 directly modified route files. Four untouched intentionally: `/hr/colleges` redirect, `/hr/messages` conversations re-export, `/hr/placements` existing shared RecruiterPlacementPortfolio and `/hr/profile` existing shared profile editor/access surfaces.
- **Shared UX work:** elevated pre-existing `text-primary-text` to deep teal (WCAG-safe) for link text; keyboard 2px focus rings; 44px min touch targets for static buttons/links, and phone-safe native field font sizing when applicable. No route names, labels, data service, permissions, API or mutations changed; no local component fork or generic DataTable empty text added.
- **Notes and tests:** 22 notes `docs/audit/ux/hr-*.md`, 22 named `UX-hr-<page>-01` Node source checks across `tests/ux-hr-rollout-{01,02,03}.test.mjs`.
- **Execution:** GitHub connector source edits; Node/Vitest/TypeScript/browser/device tests **not executed** by lane. Orchestrator should run `node --test tests/ux-hr-rollout-*.test.mjs`, `npm run typecheck`, `npm run lint`, `npm run ux:audit:verify`, and browser/AT 320/360/390 viewport checks.
- **Integration:** Lane branch `chatgpt/chat-19-b`; commit tag `[chat-19]`. Other lane's `/mentor` scope untouched.
