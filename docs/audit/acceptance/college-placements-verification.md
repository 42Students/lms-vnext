# College / Placements — chat-6 gap verification

Audited against `docs/audit/pages/college/placements.md`; tests **written but not executed**.

| ID | Status | Evidence and named test |
|---|---|---|
| COL-placements-01 | DONE | `src/modules/placements/college-application-stage-service.ts, src/components/placements/college-application-pipeline-controls.tsx, tests/integration/college-placements-interviews.test.ts (persisted stage/history)`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-01 supports transition guards and per-row/bulk Reinstate/Move` |
| COL-placements-04 | DONE | `src/components/placements/college-interview-appointments.tsx`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-04 schedules and changes college interview outcomes` |
| COL-placements-05 | DONE | `src/modules/placements/college-drive-applications-model.ts, src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx, tests/integration/college-placements-interviews.test.ts (persisted stage/source filters)`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-05 scopes applicant filters by source academic department program batch and stage` |
| COL-placements-06 | DONE | `src/modules/placements/college-application-stage-service.ts`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-06 caps all-matching selection and reports per-candidate failures` |

| COL-placements-07 | DONE | `src/components/placements/college-application-pipeline-controls.tsx`, `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`; `tests/unit/chat6-college-placements-read-parity.test.ts` → `COL-placements-07 College pipeline table exposes legacy email college source applied date age and match score` |
| COL-placements-08 | DONE | `src/app/(authenticated)/college/placements/drives/page.tsx`, `src/components/placements/college-drive-bulk-actions.tsx`, `src/components/placements/college-drive-row-lifecycle-action.tsx`; `tests/unit/chat6-college-placements-read-parity.test.ts` → `COL-placements-08 College drive table has legacy columns mobile cards bulk lifecycle and row actions` |
| COL-placements-09 | DONE | `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`, `src/components/placements/college-drive-duplicate-action.tsx`, `src/components/placements/college-drive-deadline-action.tsx`; `tests/unit/chat6-college-placements-read-parity.test.ts` → `COL-placements-09 College Admin can duplicate a drive or extend the published application deadline` |
| COL-placements-21 | DONE | `src/components/placements/college-drive-pipeline-overview.tsx`, `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`; `tests/unit/chat6-college-placements-read-parity.test.ts` → `COL-placements-21 College drive overview shows pipeline stages attention badges and deep links` |

Outstanding: offer-letter attachments, company editing, analytics parity, interview calendar extras, join/outcome details and public copy. The separate College Admin pipeline stays scoped to its own college; credentials/private applicant attachments are not exposed by these tests.

Real PostgreSQL acceptance names, authored but NOT RUN: `COL-placements-01 persists stage transitions and writes immutable history` and `COL-placements-05 filters applications against persisted stage and source` in `tests/integration/college-placements-interviews.test.ts`.
