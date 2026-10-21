# Work packet: edit src/components/courses/faculty-quiz-review.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md

## G2-3-006-038  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:309-338`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:95-100`; `src/components/courses/faculty-quiz-review.tsx:159-203`
- Fix: Release gate must be after deadline, publishing grade visibility affects entire quiz; vNext policy requires review with actual deadlineReached value passed default false.

## G2-3-006-055  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:226-231`; `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:239-251`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:113-118`; `src/components/courses/faculty-quiz-review.tsx:159-203`
- Fix: Legacy cancels stale quiz list requests, locks results toggles; vNext fetch/read delayed action lock should ignore responses after delivery/role switch.

## G2-3-006-026  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:238-253`
- vNext now: `src/components/courses/faculty-quiz-review.tsx:159-203`
- Fix: Legacy results toggle toast exact Withholding results… / Releasing results… and Results withheld/Results released to students; vNext generic success result notice.
