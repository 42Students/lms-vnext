# UX rollout: /teacher/contacts

- Playbook: `docs/design-system/UX-PLAYBOOK.md` (signed off); route ownership: chat-3.
- Before: Audited the canonical contacts redirect rather than introducing a duplicate directory; original page lacked consistent phone fit or contrast-safe interaction details where applicable.
- After: Kept this compatibility/authorized router as a route-only surface; no extra h1, duplicate data request or blank intermediate state.
- Preserved: redirect to /teacher/contacts/allContacts retained. No new wording, data, permissions or actions.
- States: existing server route/error/empty states unchanged; browser 320/360/390, WebView focus, screen reader and latency evidence **not executed**.
- Test: `tests/unit/UX-teacher-pages-round1.test.ts` — `UX-teacher-contacts-01` (source contract, not runtime acceptance).
