# College / Placements — chat-6 gap verification

Audited against `docs/audit/pages/college/placements.md`; tests **written but not executed**.

| ID | Status | Evidence and named test |
|---|---|---|
| COL-placements-01 | DONE | `src/modules/placements/college-application-stage-service.ts, src/components/placements/college-application-pipeline-controls.tsx`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-01 supports transition guards and per-row/bulk Reinstate/Move` |
| COL-placements-04 | DONE | `src/components/placements/college-interview-appointments.tsx`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-04 schedules and changes college interview outcomes` |
| COL-placements-05 | DONE | `src/modules/placements/college-drive-applications-model.ts, src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-05 scopes applicant filters by source academic department program batch and stage` |
| COL-placements-06 | DONE | `src/modules/placements/college-application-stage-service.ts`; `tests/unit/chat6-college-placement-verified-pipeline.test.ts` → `COL-placements-06 caps all-matching selection and reports per-candidate failures` |

Outstanding: offer-letter attachments, company editing, analytics parity, interview calendar extras, join/outcome details and public copy. The separate College Admin pipeline stays scoped to its own college; credentials/private applicant attachments are not exposed by these tests.
