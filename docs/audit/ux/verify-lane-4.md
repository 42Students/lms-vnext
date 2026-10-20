# Lane 4 — second-pair polish verification

## 1. `src/app/(authenticated)/hr/activity/page.tsx`
- Regressions found/fixed: 0. Read page, its imported Tabs/NeedsDoingChips/Input/Button/StatusBadge/EmptyState/ErrorState/PageHeader, recruiter authorization and activity query, HR layout, route `loading.tsx` and `error.tsx`, and lane-14 polish evidence. Search, tab link params, CSV href, permission guard, date formatting, row/link structure, empty/filter recovery and responsive controls retain their contracts.
- Extra clutter/alignment: 0; no new change warranted after static review at phone/tablet breakpoint classes.
- Files changed: verified, no change. No runtime or CI.

## 2. `src/app/(authenticated)/hr/calendar/page.tsx`
- Regressions found/fixed: 1 — the Jump to date GET form omitted the current `category`, silently resetting the event filter; restore it in a hidden field. Inspected page, DateInput, CalendarGrid, ScrollCue, SummaryStrip, Tabs and status/empty/error primitives, recruiter calendar CSS modules, route `loading.tsx`/`error.tsx`, HR and authenticated layouts, and lane-14 proof.
- Extra clutter/alignment: 3 — avoid duplicate week-date range line; suppress empty calendar grid/agenda under the existing EmptyState; keep agenda event rows single-column at desktop rather than compressed two-column. Query routes, event labels, permissions and IST date rendering retained.
- Files changed: `src/app/(authenticated)/hr/calendar/page.tsx`. Static source inspection only; no runtime or CI.
