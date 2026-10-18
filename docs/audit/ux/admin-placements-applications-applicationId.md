# /admin/placements/applications/[applicationId] · UX source review

- **Weakness / baseline:** Application detail relies on the shared read-only detail component plus a separate stage-history section.
- **Source work / disposition:** Shared detail now uses a single shell main landmark and 44px focus-visible navigation. Preserved status-history and no-transition copy.
- **States reviewed:** Inaccessible record not-found, stage-history empty state, status badges and IST timestamps.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-applications-applicationId-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
