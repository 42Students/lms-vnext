# UX rollout — /hr/conversations/[threadId]

- **Route:** src/app/(authenticated)/hr/conversations/[threadId]/page.tsx
- **Test:** UX-hr-conversations-threadId-01 (`tests/ux-hr-rollout-01.test.mjs`).
- **Earlier weakness:** 9 low-contrast `text-primary-text` utility occurrences; static actions lacked consistent keyboard focus and selected controls were smaller than 44px.
- **Change:** Preserved all original page labels, headings, filter values, notices and APIs. Upgraded readable link color to the shared deep-teal token, added 2px focus outlines to 9 links and 0 buttons and normalized 0 input/select/textarea targets where applicable. Existing shared PageHeader, EmptyState and ErrorState are retained without bespoke replacements.
- **States:** Existing access, invalid query, partial, empty, pagination and error paths are preserved; no invented records, retries or UI strings. Mobile/AT acceptance is orchestrator-owned.
- **Test/acceptance:** Named static source regression test authored; execution of typecheck/lint/unit/browser remains with orchestrator and is not represented as having run.

## Conversation thread navigation privacy

HR-BREAK-CONVO-THREAD-SCOPE-37 remounts the reply form and read-acknowledgment control per thread ID, so unsent message text, pending confirmations and prior acknowledgment state do not follow another thread in a retained App Router slot. Backend mutation authorization is unchanged. Regression: `tests/unit/HR-BREAK-chat19-conversation-thread-scope.test.tsx`. Real browser transitions and screen-reader focus remain pending.
