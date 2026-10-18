# UX rollout: /teacher/courses/[deliveryId]/[...courseTab]

- Playbook: `docs/design-system/UX-PLAYBOOK.md` (signed off); route ownership: chat-3.
- Before: Audited authorized tab parsing and aggregate data loader without a second page shell; original page lacked consistent phone fit or contrast-safe interaction details where applicable.
- After: Kept this compatibility/authorized router as a route-only surface; no extra h1, duplicate data request or blank intermediate state.
- Preserved: invalid lesson id still 404 and unsupported tabs redirect home. No new wording, data, permissions or actions.
- States: existing server route/error/empty states unchanged; browser 320/360/390, WebView focus, screen reader and latency evidence **not executed**.
- Test: `tests/unit/UX-teacher-pages-round1.test.ts` — `UX-teacher-courses-deliveryId-courseTab-01` (source contract, not runtime acceptance).
