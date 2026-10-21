# Typecheck lane 1

- TS2322 `branding/loading.tsx:12` — Invalid shape `form` changed to `card`; this is the existing runtime fallback branch, so skeleton output is identical.
- TS2322 `companies/[companyId]/page.tsx:162` — Five statistic tuples declared `as const`, retaining string labels, values and order.
- TS2322 `offers/page.tsx:67` — Unsupported `defaultOpen` removed from native details; same browser default collapsed state and summary toggle.
- TS2741 `prep-readiness/error.tsx:5` — Explicit required `description=""` added; no visible copy introduced, Retry unchanged.
- TS2322 `faculty-attendance-schedule-editor.tsx:130` — Unsupported native details `defaultOpen` removed, preserving keyed summary and all form interactions.
- TS2322 `mentor-task-details-edit.tsx:108` — Unsupported native details `defaultOpen` removed; summary, fields, task mutation and review flow unchanged.
- TS2322 `recruiter-leads-workspace.tsx:1030` — Corrected GridWorkspace render-prop child to be the only child, returning existing feedback, roster display controls and RecruiterTpoGrid together in a Fragment with unchanged column selection.
- TS2769 `super-admin-person-audit-service.ts:29` — Captured and narrowed selected college ID before async transaction, reused in permission resource and Drizzle comparison without widening audit scope.

Each changed file statically rechecked for matching JSX tags, imports, duplicate attributes and strict-typing intent. No `any`, `ts-ignore`, packages or CI.