# UX rollout: /teacher/courses/[deliveryId]

- Playbook: `docs/design-system/UX-PLAYBOOK.md` (signed off); route ownership: chat-3.
- Before: Audited valid-course deep links resolve to the authorized home tab; original page lacked consistent phone fit or contrast-safe interaction details where applicable.
- After: Kept this compatibility/authorized router as a route-only surface; no extra h1, duplicate data request or blank intermediate state.
- Preserved: invalid delivery ids still 404. No new wording, data, permissions or actions.
- States: existing server route/error/empty states unchanged; browser 320/360/390, WebView focus, screen reader and latency evidence **not executed**.
- Test: `tests/unit/UX-teacher-pages-round1.test.ts` — `UX-teacher-courses-deliveryId-01` (source contract, not runtime acceptance).
