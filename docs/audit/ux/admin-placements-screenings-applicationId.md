# /admin/placements/screenings/[applicationId] · UX source review

- **Weakness / baseline:** The screening detail is a shared read-only status/facts view.
- **Source work / disposition:** Adopted the shared detail's single-landmark and accessible back-link behavior; service and sensitive-field scoping retained.
- **States reviewed:** Inaccessible screening not-found, status and scoped facts.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-screenings-applicationId-01`, plus shared-contract assertions where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, phone, desktop, native-app and screen-reader evidence remain pending orchestrator execution.
