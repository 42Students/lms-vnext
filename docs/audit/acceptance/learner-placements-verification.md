# Learner Placements — chat-7 verified gap-closure evidence

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`. These rows record code and authored test evidence, **not executed test results**. The orchestrator performs test execution and promotion after merging.

| ID | Status | Evidence (source, test and test name) |
|---|---|---|
| LEARNER-placements-13 | DONE | `src/modules/placements/saved-job-service.ts`, `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts`, `src/components/placements/learner-jobs-browse.tsx`, `src/components/placements/learner-save-drive-button.tsx`; `tests/unit/learner-placements-13-saved-drives.test.ts` — `LEARNER-placements-13 saved drive bookmarks`; `tests/unit/learner-placements-13-saved-urls.test.ts` — `LEARNER-placements-13 saved tab URL`; `tests/unit/learner-placements-13-saved-wiring.test.ts` — `LEARNER-placements-13 saved job request wiring`. Tests authored, not run. |
| LEARNER-placements-20 | BLOCKED | Private object-storage bucket and malware scanner are required for profile resume upload/preview and application-attachment receipts; do not imply a resume was sent. |
| LEARNER-placements-19 | NOT-A-GAP | `src/modules/placements/learner-drive-pagination-model.ts` already defaults to 20 items; `tests/unit/learner-placements-19-page-size.test.ts` — `LEARNER-placements-19 uses the legacy 20-role page size already`. |
| LEARNER-placements-21 | DONE | `src/components/placements/learner-placement-jobs.tsx` has Ready to apply?, What exactly gets shared?, Role/Company/Resume, Confirm & apply and Not yet; `tests/unit/learner-placements-21-confirm-copy.test.ts` — `LEARNER-placements-21 exposes consent disclosure and exact confirm/not-yet actions`. |

## Authored but not yet full-gap-closed

The following have gap-named tests, but broader legacy requirements are still under review or incomplete; do not promote them to DONE from these partial assertions: `LEARNER-placements-04`, `-07`, `-14`, `-29`, `-37`, `-47`, `-R02`, `-R05`. Sources and tests are `tests/unit/learner-placements-<ID>-*.test.ts`; some checks cover a model/edge only, not the whole page or cross-entity effect. No tests executed by builder.
