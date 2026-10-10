# W02 — Learning, assessments and Faculty/Learner parity

**Chat 2 / issue #22**. Source checkpoint 2026-10-10 IST. Exclusive scope DB05/DB06, Learner/Faculty course, learning, quiz, assignment, attendance and delivery/report behaviors. All commits go to `main`. Only W01 writes the Drizzle journal, `src/db/schema/index.ts`, common CI/authorization and package files.

## Locked source references
- Legacy BE `42Students/lms@prod-2026` `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`
- Legacy FE `42Students/lms2-fe@prod-2026` `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`
- Starting main `7a3da73d3598b5a208040c50789074492eb1d860`
- FE regression oracle: `src/__tests__/allQuizzesExpiredRow.test.jsx`, includes missed/expired `View answers`, submitted-expired `Review attempt`, future `Start Quiz` and no `Retake Quiz` after expiry.
- BE oracle: `QuizServiceImpl.getQuizForAttempt` blocks opening a fresh attempt past deadline; `QuizServiceImpl.submitQuiz` checks expiry + max attempts; legacy student assignment submission remains accepted late while published.

## Database-first census (not semantic verification)

| Domain | Candidate tables | Source-derived columns | End-to-end runtime-verified |
| --- | ---: | ---: | ---: |
| DB05 Courses / Content | 7 | 92 | 0 |
| DB06 Assessments / Attendance | 21 | 248 | 0 |

28 candidate tables / 340 source-field candidates are *inventory*, not a 340-field parity implementation claim. Particular unresolved legacy data concepts: course introduction/rich HTML/takeaways, lesson class ordering, assignment upload receipts and private storage, grading audit, faculty quiz/assignment reports, attendance, classroom messages. Historical exams/monitoring/face-result tables must be individually classified as active/retired or explicitly waived, rather than imported blindly.

## Source changes already committed to main in this batch

- `src/modules/courses/quiz-attempt-service.ts`: current quiz deadline/status/maxAttempts/delivery and persisted learner identity/role checks inside a transaction; shared quiz row lock serializes with Faculty CLOSE/update while allowing concurrent *different learners*; quiz+membership advisory lock serializes retrying same learner so count + insert cannot exceed maxAttempts.
- `src/components/courses/quiz-overview-state.ts`: explicit action decision for Start Quiz, Retake Quiz, expired missed View answers (read-only review), expired submitted Review attempt, closed review and published result. `learner-assessment-overview.tsx` deep links now use that exact action's review state, not only coarse progress status.
- `src/modules/courses/assignment-submission-service.ts`: retains the legacy late-submission rule, but rejects when an assignment was archived during the attempt; persisted membership/user/role rechecked under a transaction.
- `tests/unit/quiz-overview-state.test.ts`: boundary and legacy display contract **authored, not executed**.
- `tests/integration/courses-c4a-assignments.test.ts`: faculty ARCHIVE vs learner POST in-flight lock regression **authored, not executed**.
- `tests/integration/courses-c4b-quizzes.test.ts`: faculty CLOSE vs learner POST race; existing same-learner concurrent final attempt test retained **authored, not executed in this session**.

## Explicit blockers — do not mark DONE

1. **CI:** Current GitHub Actions runs report failure, prior job-step/log introspection indicated no steps or downloadable logs. No successful lint, TypeScript, Vitest, DB integration, build or Playwright evidence has been produced in this W02 chat.
2. **Postgres:** These code changes do not require a new migration, but correctness still needs *executed* disposable PostgreSQL tests, including tenant negative cases, due moment and concurrent Faculty mutations.
3. **Answer privacy:** Legacy expired/missed read-only answer review versus unpublished-results key withholding still needs current-oracle browser/API proof; view links must not bypass the result publication policy.
4. **DB05/06 remaining:** all source-derived columns need semantic mapping and active/retired classification, W01-registered migration replay for new required fields, write/read producer→consumer tests, and lifecycle audits. Specific open scope: course overview rich authoring, lesson viewer, upload resources/video, assignment files, faculty reports, lecture/schedule attendance and grading audit.
5. **UI:** Faculty global All Quizzes and All Assignments pages remain missing in the matrix; Learner mobile and historical course delivery need re-verification; source checks alone cannot make old `CLOSED` rows fresh.
6. **Coordination:** W01 owns registered migration/journal and shared storage/IAM; W06 owns notification outbox. Do not duplicate. W02 calls those platform services after their tested contracts exist.

## Next work item

Implement the DB06 `assignment_upload_receipt` private file-submission lifecycle and learner/Faculty authoring/viewing UI **after** resolving the W01 storage/upload API contract. Meanwhile continue the W02-only existing-schema Faculty aggregate quizzes/assignments pages and assessment visibility boundary tests.

The workstream will report every outcome as authored vs executed vs passed and will keep ledger rows `FIXED` until browser + database parity gates close.
