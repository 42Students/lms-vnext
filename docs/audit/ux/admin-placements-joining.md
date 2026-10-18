# /admin/placements/joining · UX source review

- **Weakness / baseline:** Joining outcome records were already a thin shared-directory route.
- **Source work / disposition:** Shared responsive filter/cards now apply; preserved read-only joining-outcome wording and no inferred pending state.
- **States reviewed:** Scope denial, invalid filters, zero joining records and pagination.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-joining-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
