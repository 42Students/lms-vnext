# UX — /admin/course-progress

- **Prior issue / review:** Checked the selected Super Admin page for phone containment, accessible navigation, 44px targets, readable contrast and continuity of legacy labels, filters, error and permission states. Child workspace components still own detailed forms and actions.
- **Change:** Applied responsive min-width containment, replaced 5 short targets and 8 decorative-teal small-text uses. Kept original scope authorization, pagination links and user-visible copy.
- **States:** Source code retains existing error, empty and loading pathways. A real 320/360/390px, keyboard, screen-reader and WebView pass is still required.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-course-progress-01`.

## Bounded loading and retry
- Upgraded the indefinite skeleton to `GracefulPageLoading` while retaining “Loading course progress”. A reduced-motion loading shape and 12-second recovery control are provided; source test `UX-admin-course-progress-03`.

## Cross-audit chat-12 — MAJOR form control correction

The course-progress read-only filter surface still used raw browser selects/search or action button markup. These bypass the audited shared 16px and 44px focus contract at 320/360/390; some text-form controls inherited 14px iOS zoom behavior. Replaced `Input`×1, `Select`×1, `Button`×1 with shared UI primitives, retaining query parameter names, labels, defaults, scope, and service behavior. Test: `tests/unit/UX-admin-course-progress-12-01.test.ts`. No edit/delete behavior changed; runtime/AT validation pending.
