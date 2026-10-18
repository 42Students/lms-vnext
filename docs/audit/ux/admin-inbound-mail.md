# /admin/inbound-mail · UX source review

- **Weakness / baseline:** The message list already used responsive cards and a shared Drawer. The read action was 40px and the selected-state action used low-contrast white on brand teal.
- **Source work / disposition:** Raised the read target to 44px, added visible focus styling and high-contrast action foreground in InboundMailList. Retained recipient/status filters, drawer title, and optimistic version check.
- **States reviewed:** Invalid filter alert, honest unavailable-storage state, no matching messages, busy status change and recoverable update errors.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-inbound-mail-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
