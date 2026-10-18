# /admin/placements/offers/[offerId] · UX source review

- **Weakness / baseline:** The offer detail route delegates to the scoped read-only placement detail renderer.
- **Source work / disposition:** Shared details now avoid a second main landmark and provide 44px keyboard-focusable back/related actions.
- **States reviewed:** Inaccessible offer not-found, status badge, recorded offer facts and directory return.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-placements-offers-offerId-01`, plus shared-contract assertions where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, phone, desktop, native-app and screen-reader evidence remain pending orchestrator execution.
