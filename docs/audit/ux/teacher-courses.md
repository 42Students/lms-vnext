# UX rollout: /teacher/courses

- Playbook: `docs/design-system/UX-PLAYBOOK.md` (signed off); route ownership: chat-3.
- Before: Course directory and filter-reset affordance fit narrow viewports; original page lacked consistent phone fit or contrast-safe interaction details where applicable.
- After: Applied signed-off deep-teal link text, visible 2px focus outlines and at least 44px touch targets; responsive `min-w-0` root where rendered.
- Preserved: faculty course list and real Section scope unchanged. No new wording, data, permissions or actions.
- States: existing server route/error/empty states unchanged; browser 320/360/390, WebView focus, screen reader and latency evidence **not executed**.
- Test: `tests/unit/UX-teacher-pages-round1.test.ts` — `UX-teacher-courses-01` (source contract, not runtime acceptance).
