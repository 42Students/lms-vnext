# /tracker/audit-findings — UX source review

- **Surface:** `src/app/(authenticated)/tracker/audit-findings/page.tsx`.
- **Before:** Desktop-width six-column table obscured finding details on 320–390px phones.
- **After:** Migrated both the findings directory and refused-file diagnostics to shared responsive DataTables with explicit empty copy; finding ID/title is primary, three secondary fields stay visible and remaining details are recoverable. View/finding links meet 44px.
- **Authority and states:** Retains global-role and no-acting-scope fences, URL filters, results counts and import-status failures.
- **Test:** `tests/unit/UX-tracker-audit-findings-01.test.ts` (authored, **unexecuted**).
- **Still needed:** 320/360/390px device, keyboard, screen-reader and typecheck/unit evidence before acceptance; canonical role UI audits owned by the HR slice where delegated.
