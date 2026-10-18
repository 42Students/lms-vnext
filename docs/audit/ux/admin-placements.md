# /admin/placements · UX source review

- **Weakness / baseline:** The drive command center had a New drive header action under the minimum touch size and white brand text below contrast requirements.
- **Source work / disposition:** Upgraded the header action to 44px with dark foreground and an explicit focus outline. Kept PlacementOperationsWorkspace and safety-scope decision.
- **States reviewed:** No college selected, scoped policy read, available workspace and drive attention actions.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
