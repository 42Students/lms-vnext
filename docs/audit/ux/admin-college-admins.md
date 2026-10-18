# UX — /admin/colleges/[collegeId]/admins

- **Before:** A full-width desktop table was the only way to inspect college-admins; links were under 44px and could be low-contrast on light surfaces. The route also nested a `main` landmark inside the authenticated shell.
- **After:** Shared `DataTable` renders a single responsive table/card set, with primary and secondary labels, original actions still visible on phones, and explicitly preserved empty copy. Removed the nested `main` and strengthened keyboard/touch link presentation.
- **States:** Original college/administrator authorization and lookup behaviour stays server-driven; `DataTable.empty` announces zero records; the original truncation, pagination, session revocation and history export remain available.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-college-admins-01`. Source-only; runtime and device evidence pending.
