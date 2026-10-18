# /admin/placements/joining/[offerId] · UX source review

- **Weakness / baseline:** Joining detail delegates through a shared read-only detail renderer.
- **Source work / disposition:** Single landmark plus keyboard-focusable back links introduced in shared detail; source service and scope unchanged.
- **States reviewed:** Not-found inaccessible offer, recorded joining outcome and return to directory.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-joining-offerId-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
