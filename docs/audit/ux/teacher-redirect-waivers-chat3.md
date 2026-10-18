# Faculty redirect-only UX exceptions — chat-3

The UX coverage matrix currently lists four Faculty routes as `noShared`. These are intentional one-step route transitions, not rendered pages. Introducing a decorative `PageHeader`, `Button` or `Card` before a server redirect would be nonfunctional, increase navigation latency and potentially show data before the actual Faculty Section permission check.

| Route | Reason no shared UI component is appropriate | Guard / behavioural coverage |
| --- | --- | --- |
| `/teacher/contacts` | Permanent alias to legacy `/teacher/contacts/allContacts`; no page output | Parent Teacher layout authenticates the Faculty role; `UX-teacher-no-shared-01` exact redirect |
| `/teacher/courses/[deliveryId]` | Canonical course home is `[...courseTab]`; entry route validates ID then redirects without painting a second shell | `validFacultyDefaultDeliveryId` / `facultyCourseTabHref`, `UX-teacher-no-shared-01` valid and invalid IDs |
| `/teacher/courses/[deliveryId]/attendance-corrections` | Legacy bookmark replaced by authorization-checked attendance detail | `getFacultyCorrectionAvailability` checks actual teaching Section before redirect; `UX-teacher-no-shared-01` denied and valid paths |
| `/teacher/courses/[deliveryId]/notices` | Retired notice-board bookmark replaced by authorized Discussions | `getFacultySectionNotices` checks actual teaching Section first; malformed IDs now invoke private `notFound()` rather than uncaught Zod; `UX-teacher-no-shared-01` denied and valid paths |

Behavioural test: `tests/unit/UX-teacher-redirect-no-shared-route-journey.test.tsx`, cases `UX-teacher-no-shared-01`. The components rendered at the canonical redirect destinations are covered by the corresponding `UX-teacher-*-coverage-01` tests; the parent Faculty layout supplies role-guarded navigation, focus landmark and skip link.

**Reviewer status:** Proposed for the central `docs/audit/ux/COVERAGE-WAIVERS.md` registry; no auto-generated matrix was overwritten. Cloud CI, keyboard focus after a real browser redirect, reduced-motion and smartphone walkthrough remain unverified.
