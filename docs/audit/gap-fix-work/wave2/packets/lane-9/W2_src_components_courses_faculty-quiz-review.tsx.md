# Work packet (wave 2): edit src/components/courses/faculty-quiz-review.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md

## G2-3-006-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:319-338`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:159-203`
- Fix: Legacy Results control text Released · Withhold / Release results / Release after deadline; vNext result update in drawer with alternative action labels.

## G2-3-006-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:143-198`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:46-64`
- Fix: Legacy submitted learners show roll/mobile fallback, six colored initial avatars and threshold score pills; new review lists learnerDisplayName/email/short membership ID.

## G2-3-006-030  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:615-674`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:205-220`
- Fix: Legacy Submissions modal centered width 720 with rows/tinted avatar; vNext faculty review Drawer and detail view.

## G2-3-006-033  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:516-530`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:123-157`
- Fix: Legacy unpaged getQuizSubmissionsV2 per quiz, vNext GET quiz-attempts scoped to deliveryId; verify shared offering cross-section submissions access.

## G2-3-006-049  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:615-674`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:205-220`
- Fix: Legacy modal title names submissions dialog; vNext Drawer does too but opening/focus/backdrop behavior and list semantics differ.

## G2-3-006-054  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:480-486`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:40-44`; `src/components/courses/faculty-quiz-review.tsx:113-118`
- Fix: Legacy URL `?content=<numeric id>` auto-opens submissions; vNext expects UUID pattern and scrolls selected page, opens review if permitted. Old deep links need redirect resolution.
