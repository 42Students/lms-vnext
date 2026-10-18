# /tracker/audit-findings — UX source review

- **Surface:** `src/app/(authenticated)/tracker/audit-findings/page.tsx`.
- **Before:** Desktop-width six-column table obscured finding details on 320–390px phones.
- **After:** Migrated the findings directory to the shared responsive DataTable with primary ID/title, three secondary fields, collapsed recoverable detail, explicit legacy empty copy and min-44px finding/view links.
- **Authority and states:** Retains global-role and no-acting-scope fences, URL filters, results counts and import-status failures.
- **Test:** `tests/unit/UX-tracker-audit-findings-01.test.ts` (authored, **unexecuted**).
- **Still needed:** 320/360/390px device, keyboard, screen-reader and typecheck/unit evidence before acceptance; canonical role UI audits owned by the HR slice where delegated.
