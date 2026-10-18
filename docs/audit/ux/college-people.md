# UX review: /college/people

- Route: `src/app/(authenticated)/college/people/page.tsx` under the chat-4 College Admin first-half slice.
- Existing legacy words, exact authorization and mutation/navigation flows maintained.
- Source changes: intentional existing redirect to `/college/contacts` remains; introducing a redundant page would damage navigation.
- States: No direct DataTable; delegated shared content owns its empty/error states. No invalid fabricated status or new APIs.
- Named source-contract test: `tests/unit/UX-college-college-people-01.test.ts` created; CI and browser checks unexecuted.
