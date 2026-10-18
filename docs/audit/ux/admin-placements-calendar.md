# /admin/placements/calendar · UX source review

- **Weakness / baseline:** This route passes scoped selected-college data to the established PlacementCalendarWorkspace.
- **Source work / disposition:** Retained the calendar workspace and exact-college EmptyState, without parallel calendar rendering.
- **States reviewed:** No college selection, persisted interview calendar and scoped controls.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-calendar-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
