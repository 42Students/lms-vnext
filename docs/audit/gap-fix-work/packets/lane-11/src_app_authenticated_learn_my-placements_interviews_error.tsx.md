# Work packet: edit src/app/(authenticated)/learn/my-placements/interviews/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-016  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:118-119 failed GET shows warning 'We could not load your schedule' with Retry.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/error.tsx:13-22 shows 'Interviews could not load', explains nonempty, Retry and All interviews.
- Fix: Use Schedule error copy on legacy /interviews alias; retain accurate failure != empty distinction.
