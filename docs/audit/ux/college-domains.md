# UX review: /college/domains

- Route: `src/app/(authenticated)/college/domains/page.tsx`, owned by chat-4 first-half College rollout.
- Exact legacy labels and all authorized mutations preserved.
- Improvements: overflow containment.
- Guardrails: existing tenant membership, module-off/error notices and read-only flows remain intact. No direct DataTable; delegated control provides states.
- Test authored: `tests/unit/UX-college-college-domains-01.test.ts`; CI/browser/device evidence outstanding, so list not prematurely checked.
