# UX review: /college/groups/[groupId]/rule-preview

- Source: `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`, chat-4, signed-off UX playbook.
- Exact legacy labels, search query semantics, back links, tenant authorization and mutation controls preserved.
- Improvements: deep-teal link contrast; page-width containment.
- UX states: existing empty/error/permission messaging kept; No direct DataTable; delegated component owns empty states. Form controls remain labelled and query-based; no artificial metrics.
- Test: `tests/unit/UX-college-college-groups-group-id-rule-preview-01.test.ts`, authored only. Device/CI tests and source sign-off pending.
