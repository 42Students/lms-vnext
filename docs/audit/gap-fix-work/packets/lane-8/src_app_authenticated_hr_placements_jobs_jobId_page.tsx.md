# Work packet: edit src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-017  [P1] GAP  facet F04  effort S
- Legacy: Scheduled when booked/date even if round status pending `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:358`
- vNext now: VNext status-only Not scheduled `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:795`
- Fix: Derive scheduled state from booked/date

## G2-11-002-024  [P1] MISSING  facet F05  effort M
- Legacy: Search appears only when >8 applicants `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:319`
- vNext now: No inline name/roll/email search `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:534`
- Fix: Implement conditional search

## G2-11-002-041  [P1] GAP  facet F07  effort S
- Legacy: Offers load error with inline Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:488`
- vNext now: VNext coupled page read error `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:134`
- Fix: Separate offers retry

## G2-11-002-049  [P1] MISSING  facet F08  effort S
- Legacy: Selection submitted success count with verification warning `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:717`
- vNext now: No selection send receipt `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:683`
- Fix: Restore exact receipt

## G2-11-002-050  [P1] GAP  facet F09  effort S
- Legacy: Modal Choose round for these decisions `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:278`
- vNext now: Defaults selected round `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:176`
- Fix: Prompt when multiple open rounds

## G2-11-002-058  [P1] MISSING  facet F10  effort S
- Legacy: POST ZIP resumes endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:131`
- vNext now: Individual resume downloads only `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:595`
- Fix: Restore secure ZIP

## G2-11-002-069  [P1] GAP  facet F13  effort S
- Legacy: Partial refresh warning and Retry drive `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:210`
- vNext now: Focus refresh no last-known warning `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:275`
- Fix: Preserve partial data/retry

## G2-11-002-070  [P1] GAP  facet F13  effort S
- Legacy: Not shared explanatory alert `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:299`
- vNext now: Shared applicants section `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:516`
- Fix: Distinct not-shared state

## G2-11-002-072  [P1] MISSING  facet F14  effort M
- Legacy: Download resumes ZIP `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:547`
- vNext now: Single applicant resume download `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:595`
- Fix: Bulk ZIP action

## G2-11-002-042  [P2] GAP  facet F07  effort S
- Legacy: No-college scope result `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:193`
- vNext now: Redirect dashboard `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:95`
- Fix: Restore scope-specific state

## G2-11-002-043  [P2] GAP  facet F07  effort S
- Legacy: Access ended info Result `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:194`
- vNext now: NotFound generic failure `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:116`
- Fix: Restore access-ended message
