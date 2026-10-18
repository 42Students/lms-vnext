# UX review: /college/electives/[slotId]/allocate

- Route: `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`, owned by chat-4 first-half College rollout.
- Exact legacy labels and all authorized mutations preserved.
- Improvements: accessible primary controls; accessible link contrast; single-column narrow fields; overflow containment.
- Guardrails: existing tenant membership, module-off/error notices and read-only flows remain intact. No direct DataTable; delegated control provides states.
- Test authored: `tests/unit/UX-college-college-electives-slot-id-allocate-01.test.ts`; CI/browser/device evidence outstanding, so list not prematurely checked.
