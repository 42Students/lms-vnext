# UX rollout — /campaign-unsubscribe/confirmed

- **UX ID:** UX-campaign-unsubscribe-confirmed-01. Confirmation is reached only after the existing same-origin successful POST redirect. This screen must not itself write suppression data.
- **Before:** a simple ungrouped heading/body/link with undersized unstyled Return home action and weak visual grouping.
- **Improvements:** preserve `You're unsubscribed` and `Email preference updated` titles and their exact separate placement-cell/global explanations in shared `PageHeader` and `Card`; `role=status` confirms result; phone-first centered min-h-dvh public composition; 44px accessible, focusable Return home link; bounded loading and public error fallback.
- **States:** the `scope=placement-cell` distinction remains; transactional email caveat remains only for the global suppression confirmation. No server-generated false confirmation, no raw data.
- **Tests:** `tests/unit/UX-campaign-unsubscribe-confirmed-01.test.ts` authored; pending Vitest/TypeScript, browser/WebView, device and screen-reader checks before ticking route.
