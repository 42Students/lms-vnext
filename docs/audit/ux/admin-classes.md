# UX — /admin/classes

- **Before:** Dense wide roster forced sideways scrolling on phones; filter fields had hard minimum widths; links could be 40px tall or low-contrast.
- **After:** Existing Manage classes rows now use the shared responsive `DataTable`, with an explicitly worded empty state, a primary name, visible row actions, and other fields under accessible “More details” on narrow screens. The original column labels, filter names, links and per-row mutation actions remain intact. `PageHeader` provides one route-level title; filters can stack at 320px. Interactive links meet 44px height and deep-teal link contrast.
- **States:** No selected college still uses the existing status message; empty/filtered list uses `DataTable.empty`; pagination and applied URL filters are retained; mutation pending/error stays in existing action components.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-classes-01`. Source-reviewed only; CI/browser/AT evidence pending.
