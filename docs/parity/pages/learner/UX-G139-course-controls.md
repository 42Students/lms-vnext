# UX-G139 — Course learning controls (interactive components, part 4)

**Registered scope:** `src/components/courses/quiz-attempt-control.tsx`, `resource-progress-control.tsx`, `super-admin-content-directory-page.tsx`, `super-admin-lesson-create.tsx`. Canonical status: `docs/tracker.json#uxReview.groups[UX-G139]`. The group spans learner quiz/progress controls and Super Admin lesson/content authoring; status requires both role journeys.

## Four surface review and implementation

1. **Learner quiz attempt:** Selected answers were silently dropped when **Close** was clicked. Now a confirmation dialog warns explicitly when any answer is unsent; cancelling keeps every selection. Navigation links announce whether each question is answered, the count has polite live status, questions have scroll offsets and long option text wraps on narrow screens. The **Submit quiz** action stays separate and is disabled for a zero-question quiz; existing submission URL, payload, server checks and results-release policy were preserved.
2. **Learner resource progress:** Read-only until the saved server state is verified; progress retry has clear live messaging and 44px mobile tap target; reset and completion confirmations and existing optimistic guard remain intact.
3. **Super Admin content directory:** Lesson-search form is distinctly named for screen readers; search input and submit stay usable at 320–390px; lesson pagination wraps with an explicit current-page status. The directory, course/lesson selection, tenant scope, server fetches and export logic are unchanged.
4. **Super Admin lesson creation:** The course selector now exposes invalid validation state; submit button exposes busy state; help content wraps on small screens. The selected-course and duplicate-submit checks remain, and submission still appends only after a successful server API response.

## Scoped acceptance

- `tests/unit/ux-g139-course-controls.test.ts`: four targeted contracts, including quiz answer preservation, progress verification, authoring validation and selected tenant scope.
- `tests/unit/learner-course-page-parity.test.ts` and `tests/unit/chat6-superadmin-middle-lessons-role-25.test.tsx`: existing navigation and role-page coverage.
- `tests/e2e/ux-g139-course-controls.spec.ts`: isolated seeded browser checks at mobile 390px and desktop 1280px and learner-negative Super Admin access; screenshots under `test-results/ux-g139-*.png`.
- `.github/workflows/ux-g139-course-controls-acceptance.yml`: exact-source-SHA focused ESLint, full TypeScript with 6GB heap, unit suites and Chromium. Do not mark DONE until the run is green and attach artifact ID/commit/run URL.
- Unchanged invariants: server-side tenant/role authorization, quiz question correctness and submission, deadline and result publication, recorded progress, learner identity, and graded state. UI-only affordances cannot grant access.

**Closure receipt:** pending execution evidence at writing; do not interpret source implementation alone as a closed group.
