# UX — /admin/batches/[batchId]/students

- **Before:** Batch class table required desktop-width horizontal scrolling; layout nested the shell main, and row actions were hard to reach on phones.
- **After:** Added shared Breadcrumbs, PageHeader and DataTable with explicit legacy empty copy, visible Manage roster action, and mobile cards for each class.
- **States:** Existing blocked/denied and mutation feedback unchanged; the empty batch class text now belongs to DataTable.empty while the roster manager remains intact.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-batches-batchId-students-01`. Source-reviewed, browser/AT/test execution pending.
