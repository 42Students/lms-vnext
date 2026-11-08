# UX-G176 · Telegram incident alert and acknowledgement copy

**Scoped engineering status:** DONE (2026-11-08). This records outbound copy, redaction and screenshot acceptance, **not** a live provider-send or production incident authorization certificate.

## Included production source
- `src/modules/log-alerts/telegram-notifier.ts`
- `src/modules/log-alerts/telegram-webhook.ts`

## Executed evidence
- Source SHA [`2e401ecbbea5dfc33d940b5258fa5495c60976ef`](https://github.com/42Students/lms-vnext/commit/2e401ecbbea5dfc33d940b5258fa5495c60976ef); exact-source [GitHub Actions run 42467433501](https://github.com/42Students/lms-vnext/actions/runs/42467433501) completed **successfully**.
- Production notifier/webhook code, fixture and test passed scoped ESLint and full TypeScript; **16/16 Vitest** cases across webhook redaction, authorization and failure handling; **2/2 real Chromium viewport tests** at **1280×800** and **390×844**.
- [Screenshot/trace artifact 13612625646](https://github.com/42Students/lms-vnext/actions/runs/42467433501/artifacts/13612625646).
- The development-only preview `src/app/e2e/ux-g176-telegram-alert/page.tsx` imports the actual production formatter and sanitization functions; never reads provider credentials, contacts Telegram, stores incident records or mutates state. The browser tests check request/deploy references, email redaction, acknowledgement label and acknowledged text, and no horizontal overflow. The fixture is unavailable unless `NODE_ENV=development` **and** `UX_G176_TELEGRAM_FIXTURE=1`.
- A compare from the accepted SHA to current `main` found **no changes** to either registered production source file.

## Boundaries and release follow-ups
- This tests how our outbound text is formatted and a simulated visual rendering, **not Telegram's actual client**, bot callback receipt, incident production delivery or carrier availability.
- Independent security/provider integration and production incident signing/actor acceptance remain separate; the suite did not weaken rate limits, alert redaction, callback authorization or cross-tenant controls.
