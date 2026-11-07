# UX-G095 — Faculty details and related pages

The faculty student detail screen now safely formats malformed timestamps, the live-class schedule links to the teaching courses directory, and profile/contact errors have 44px mobile retry targets. Existing role checks and permission-scoped reads, teacher profile edit/save workflow, notifications, and teaching directory links remain intact.

Acceptance suite: `tests/ux-cross-role-g043-g066-g095.test.mjs` (all owned route files plus role/formatting assertions). The real Faculty profile error/loading components are rendered in a CI-only preview at desktop and mobile widths with Retry and route exit checks in `tests/e2e/ux-cross-role-g043-g066-g095.spec.ts`. [CI](https://github.com/42Students/lms-vnext/actions/runs/42397390851).

Security/regression: no privilege, membership, course student scope, contact data or history mutation logic was touched. The CI preview cannot prove privileged profile-save acceptance and must be labeled accordingly.
