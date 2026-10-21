# Work packet (wave 2): edit src/components/courses/college-quiz-attempts.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-18-016-003  [P2] GAP  facet F02  effort M
- Legacy: QuizAttemptResponseDTO.java:11-25 powers legacy submission rows/details
- vNext now: src/components/courses/college-quiz-attempts.tsx:40-101 embeds Section, toggle, search, list, answers
- Fix: Compare legacy submissions dialog section/order; align list canvas and answer-detail layout without unnecessary cards

## G2-18-016-004  [P2] GAP  facet F03  effort M
- Legacy: QuizAttemptResponseDTO.java:15-23 includes learner name, roll, mobile, status and resultsVisible
- vNext now: src/components/courses/college-quiz-attempts.tsx:68-85 shows name/email/points/time/details, no roll/mobile/status
- Fix: Restore authorized roll/status; retain deliberate mobile masking under need-to-know policy; compare all labels/icons

## G2-18-016-007  [P2] GAP  facet F04  effort S
- Legacy: QuizServiceImpl.java:594-601 writes LocalDateTime.now()
- vNext now: src/db/schema/quizzes.ts:243-247 DB instant and src/components/courses/college-quiz-attempts.tsx:71-72 explicit IST formatting
- Fix: Verify exact timestamp shape, date style and Asia/Kolkata day-boundary behavior

## G2-18-016-017  [P2] GAP  facet F09  effort M
- Legacy: QuizServiceImpl.java:663-682 provides manager submission answers for legacy dialog
- vNext now: src/components/courses/college-quiz-attempts.tsx:47-85 uses in-page disclosure rather than modal
- Fix: Match legacy modal trigger, close button/focus restoration and answer layout after frontend source verification

## G2-18-016-030  [P2] GAP  facet F18  effort S
- Legacy: QuizServiceImpl.java:544-589 exact error texts; QuizAttemptResponseDTO.java:18-23 status/label fields
- vNext now: src/components/courses/college-quiz-attempts.tsx:47-64 uses 'Submissions' and section-specific empty/search text
- Fix: Crosswalk docs/audit/legacy-copy-A.md and B.md, normalize exact labels/toasts

## G2-3-001-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:71-77`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:65-73`
- Fix: Restore learner roll number/mobile fallback, `Late` tag and score badge parity on submission rows, with privacy permission check.

## G2-3-001-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:71-76`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/QuizResponseDTO.java:24-35`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:65-74`
- Fix: Use legacy `Submitted <formatted time>` and attempt tag only for attemptNumber >1 rather than unconditional `Attempt 1`.

## G2-3-001-042  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:45-82`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:48-103`
- Fix: Restore 640px submissions dialog with top-level title and modal close; vNext exposes inline scroll region.

## G2-3-001-056  [P2] MISSING  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:73-74`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:65-84`
- Fix: Recreate `Late` submission flag using author wall-clock due and actual submission instant.

## G2-3-001-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:59-60`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:601-604`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:57-63`; `src/components/courses/college-assessment-aggregate.tsx:205-210`
- Fix: Use legacy exact `No submissions yet` and `No quizzes found for this college` empty messages.

## G2-3-005-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:63-76`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:65-84`
- Fix: Submission rows need learner name, roll/mobile fallback, Submitted timestamp, conditional Attempt and Late tag, blue score.

## G2-3-005-031  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:45-82`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:52-103`
- Fix: Restore 640px submissions Modal, skeleton six rows, modal header and footerless dismissal.

## G2-3-005-042  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:69-76`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:65-84`
- Fix: Reintroduce Late chip computed from due India wall-clock versus submitted UTC server timestamp.

## G2-3-005-049  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:45-82`
- vNext now: `src/components/courses/college-quiz-attempts.tsx:25-103`
- Fix: Legacy submission Modal has accessible title and contained focus; inline detail lacks identical focus semantics.
