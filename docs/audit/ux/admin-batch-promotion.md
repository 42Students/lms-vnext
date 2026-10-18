# UX — /admin/batch-promotion

- **Before:** Some internal links used shorter-than-44px targets and decorative teal for normal-size links.
- **After:** Preserved existing PageHeader, role/scope checks, data/loading/empty branches and component-driven interactions. Raised small targets to 44px, used deep-teal accessible links and ensured 320px containment.
- **States:** Existing blocked/denied and mutation feedback unchanged; the page continues to distinguish scope absence from empty records.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-batch-promotion-01`. Source-reviewed, browser/AT/test execution pending.

## Follow-up responsive queue closure
- Replaced the fixed `min-w-[44rem]` Batch Promotion table with shared `DataTable`; preserved the exact Batch/Semester/Academic Year/Students/Status/Action labels and Preview query parameters. The legacy empty message is passed as required `empty`; row actions stay visible at 320px.
- See `UX-admin-batch-promotion-02`.
