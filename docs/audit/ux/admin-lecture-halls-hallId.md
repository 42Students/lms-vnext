# /admin/lecture-halls/[hallId] · UX source review

- **Weakness / baseline:** The availability detail nested a main landmark inside the authenticated shell and used a smaller plain back link.
- **Source work / disposition:** Removed the nested main, kept the read-only availability warning, and improved Back and schedule action focus/touch contrast.
- **States reviewed:** Invalid dates, not-found room, no bookings, potential conflict and truncated 500+ session notice.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-lecture-halls-hallId-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
