# UX review: /college/faculty

- Route: `src/app/(authenticated)/college/faculty/page.tsx`, owned by chat-4 first-half College rollout.
- Exact legacy labels and all authorized mutations preserved.
- Improvements: existing shared role directory/delegated form uses its own mobile and empty-state contracts; no duplicate wrapper added.
- Guardrails: existing tenant membership, module-off/error notices and read-only flows remain intact. No direct DataTable; delegated control provides states.
- Test authored: `tests/unit/UX-college-college-faculty-01.test.ts`; CI/browser/device evidence outstanding, so list not prematurely checked.
