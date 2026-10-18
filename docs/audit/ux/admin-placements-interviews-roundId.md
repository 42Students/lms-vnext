# /admin/placements/interviews/[roundId] · UX source review

- **Weakness / baseline:** An interview detail page delegates to the selected-college record renderer.
- **Source work / disposition:** Shared detail now has a single shell landmark and touch-size back/related links; kept permission-scoped not-found handling.
- **States reviewed:** Missing/inaccessible round not-found, descriptive status and recorded facts.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-interviews-roundId-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
