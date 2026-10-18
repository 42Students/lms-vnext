# /admin/placements/seasons/[seasonId] · UX source review

- **Weakness / baseline:** Season record detail is a shared read-only component.
- **Source work / disposition:** Shared detail now avoids nested main and improves back/related-link focus and touch area without changing legacy labels.
- **States reviewed:** Unavailable/out-of-scope season not-found, recorded facts and return navigation.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-seasons-seasonId-01`, plus shared-contract assertions where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, phone, desktop, native-app and screen-reader evidence remain pending orchestrator execution.
