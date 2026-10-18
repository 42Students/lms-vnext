# /admin/placements/new · UX source review

- **Weakness / baseline:** Drive creation is delegated to PlacementJobCreateWorkspace with the selected college.
- **Source work / disposition:** Retained shared creation flow and explicit redirect without a valid college; no alternate form or speculative labels.
- **States reviewed:** No selected college redirect, shared form validation, draft and guarded submit behavior.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-new-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; TypeScript, unit, 320/360/390px browser, native WebView, and assistive-technology verification are pending orchestrator execution.
