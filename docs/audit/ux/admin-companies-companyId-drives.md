# UX — /admin/companies/[companyId]/drives

- **Prior issue / review:** Checked the selected Super Admin page for phone containment, accessible navigation, 44px targets, readable contrast and continuity of legacy labels, filters, error and permission states. Child workspace components still own detailed forms and actions.
- **Change:** Applied responsive min-width containment, replaced 1 short targets and 2 decorative-teal small-text uses. Kept original scope authorization, pagination links and user-visible copy.
- **States:** Source code retains existing error, empty and loading pathways. A real 320/360/390px, keyboard, screen-reader and WebView pass is still required.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-companies-companyId-drives-01`.

## Responsive history rows
- Changed the desktop-only 42rem history table to shared `DataTable`; all existing column labels, server-side scope, and Open drive links remain. Phone cards expose the action without a wide viewport, and the existing empty copy is explicit. Covered by `UX-admin-companies-companyId-drives-02`.
