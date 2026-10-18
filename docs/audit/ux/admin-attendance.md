# UX — /admin/attendance

- **Before:** Some internal links used shorter-than-44px targets and decorative teal for normal-size links.
- **After:** Preserved existing PageHeader, role/scope checks, data/loading/empty branches and component-driven interactions. Raised small targets to 44px, used deep-teal accessible links and ensured 320px containment.
- **States:** Existing blocked/denied and mutation feedback unchanged; the page continues to distinguish scope absence from empty records.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-attendance-01`. Source-reviewed, browser/AT/test execution pending.

## Bounded loading and retry
- Replaced the indefinite loading pulse with the shared `GracefulPageLoading`, preserving “Loading scoped attendance”. It provides a semantic reduced-motion skeleton and a recovery control after a slow network response. Tests: `UX-admin-attendance-03`.
