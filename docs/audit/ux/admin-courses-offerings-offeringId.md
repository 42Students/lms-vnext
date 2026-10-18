# UX — /admin/courses/offerings/[offeringId]

- **Prior issue / review:** Checked the selected Super Admin page for phone containment, accessible navigation, 44px targets, readable contrast and continuity of legacy labels, filters, error and permission states. Child workspace components still own detailed forms and actions.
- **Change:** Applied responsive min-width containment, replaced 0 short targets and 0 decorative-teal small-text uses; wrapped the delegated offering workspace in a phone-safe container. Kept original scope authorization, pagination links and user-visible copy.
- **States:** Source code retains existing error, empty and loading pathways. A real 320/360/390px, keyboard, screen-reader and WebView pass is still required.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-courses-offerings-offeringId-01`.
