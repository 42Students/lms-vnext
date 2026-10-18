# UX — /admin/batch-promotion

- **Before:** Some internal links used shorter-than-44px targets and decorative teal for normal-size links.
- **After:** Preserved existing PageHeader, role/scope checks, data/loading/empty branches and component-driven interactions. Raised small targets to 44px, used deep-teal accessible links and ensured 320px containment.
- **States:** Existing blocked/denied and mutation feedback unchanged; the page continues to distinguish scope absence from empty records.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-batch-promotion-01`. Source-reviewed, browser/AT/test execution pending.
