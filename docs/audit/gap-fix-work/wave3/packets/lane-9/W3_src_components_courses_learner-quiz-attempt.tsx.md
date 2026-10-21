# Work packet (wave 3): edit src/components/courses/learner-quiz-attempt.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-065  [P1] MISSING  facet F23  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:691-752`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:606-618`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:363-429`
- Fix: Legacy teacher preview with View Submissions/View Report/answer keys is absent from vNext generic `/quiz`; route faculty to full teacher quiz preview with guarded access.
