# Learner Placements — chat-7 verified gap-closure evidence

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`. These rows record code and authored test evidence, **not executed test results**. The orchestrator performs test execution and promotion after merging.

| ID | Status | Evidence (source, test and test name) |
|---|---|---|
| LEARNER-placements-13 | DONE | `src/modules/placements/saved-job-service.ts`, `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts`, `src/components/placements/learner-jobs-browse.tsx`, `src/components/placements/learner-save-drive-button.tsx`; `tests/unit/learner-placements-13-saved-drives.test.ts` — `LEARNER-placements-13 saved drive bookmarks`; `tests/unit/learner-placements-13-saved-urls.test.ts` — `LEARNER-placements-13 saved tab URL`; `tests/unit/learner-placements-13-saved-wiring.test.ts` — `LEARNER-placements-13 saved job request wiring`. Tests authored, not run. |
| LEARNER-placements-20 | BLOCKED | Private object-storage bucket and malware scanner are required for profile resume upload/preview and application-attachment receipts; do not imply a resume was sent. |
