# Work packet: NEW / MISSING items from docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

18 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-070  [P0] GAP  facet F20  effort L
- Legacy: Legacy apply handles lost response with fresh applied lookup, never blind retry (JobDetailContent.jsx:598-629)
- vNext now: VNext catch shows `Application not submitted` toast for any POST failure, without own status reconciliation (learner-placement-jobs.tsx:202-245)
- Fix: On ambiguous network/write outcome re-read own application before saying failed or enabling retry; ensure idempotent backend writes

## G2-15-005-078  [P0] GAP  facet F23  effort L
- Legacy: Legacy verified/applied gate and durable reference/preview, error Retry (VerifiedJobDetailContent.jsx:38-112; JobDetailContent.jsx:911-1071)
- vNext now: VNext authoritative DB read but no receipt/preview or ambiguous-write reconciliation (learner-placement-jobs.tsx:188-348)
- Fix: Close duplicate-apply unknown outcome before UI clone, add durable receipt and status recheck

## G2-15-005-005  [P1] GAP  facet F02  effort L
- Legacy: Legacy two-column `<main class=ljd-layout>` left content and sticky right application rail (JobDetailContent.jsx:1094-1101,1320-1323)
- vNext now: VNext primary content then secondary two-column About/Eligibility and bottom role cards (learner-placement-job-detail.tsx:102-168,168-300)
- Fix: Move actionable Apply/receipt to right-side sticky rail, preserve left descriptive cards and mobile placement

## G2-15-005-015  [P1] MISSING  facet F04  effort M
- Legacy: Legacy full description RichTextDisplay + optional job description URL (JobDetailContent.jsx:1256-1269)
- vNext now: VNext `whitespace-pre-wrap` plain text, no JD URL in item projection (learner-placement-job-detail.tsx:169-176; jobs/[jobId]/page.tsx:15-30)
- Fix: Render sanitized rich HTML and scoped/download-safe job description document link

## G2-15-005-025  [P1] GAP  facet F06  effort M
- Legacy: Legacy app confirmation has Role Company Resume summary and What exactly gets shared? (JobDetailContent.jsx:1378-1437)
- vNext now: VNext similar modal but Resume always `Not attached`, privacy states no resume (learner-placement-jobs.tsx:429-464)
- Fix: Accurately disclose whether resume/contact shared, align value with backend POST payload

## G2-15-005-029  [P1] GAP  facet F07  effort M
- Legacy: Legacy /applied malformed/unknown blocks all apply and shows Check status again (VerifiedJobDetailContent.jsx:60-90; placementsAppliedLookup.js:1-8)
- vNext now: VNext server DB error aborts rendering with no same explicit recovery pane (learner-job-service.ts:67-153; jobs/[jobId]/page.tsx:67-85)
- Fix: Add scoped error/loading boundary and fail-closed Retry with explicit no-reapply message

## G2-15-005-030  [P1] GAP  facet F07  effort M
- Legacy: Legacy visibility fetch rejected: `This drive can't be shown` or `We couldn't load this drive` with Retry and Browse drives (JobDetailContent.jsx:843-875)
- vNext now: VNext notFound on no current row/journey; no route-owned Retry or visible error message (jobs/[jobId]/page.tsx:68-85)
- Fix: Distinguish revoked/unpublished/malformed/network vs not found and supply exact retry actions

## G2-15-005-032  [P1] GAP  facet F08  effort M
- Legacy: Legacy apply success inline `You're in — application sent`, receipt and no auto-dismiss (JobDetailContent.jsx:911-963,573-593)
- vNext now: VNext success toast `Application submitted` then router.refresh, no receipt detail (learner-placement-jobs.tsx:202-232,286-301)
- Fix: Restore durable post-apply receipt and same modal close/state transition

## G2-15-005-033  [P1] GAP  facet F08  effort L
- Legacy: Legacy withdrew success toast `Application withdrawn successfully`; application closes immediately (JobDetailContent.jsx:448-472)
- vNext now: VNext toast `Withdrawal requested`; user remains SUBMITTED pending team approval (learner-placement-jobs.tsx:247-270)
- Fix: Document approval-workflow change; use accurate copy and state; if parity required support direct eligible withdrawal

## G2-15-005-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy `GET /api/v1/jobs/{id}/visibility/{learnerId}` and getApplyCheck; detail data scoped (JobDetailContent.jsx:220-252)
- vNext now: VNext listLearnerPlacementJobs scans all published targeted opportunities then filters one job (learner-job-service.ts:67-207; jobs/[jobId]/page.tsx:68-72)
- Fix: Use ID-scoped authorized job query to avoid broad expensive whole-feed load, preserve restricted statuses

## G2-15-005-042  [P1] GAP  facet F10  effort L
- Legacy: Legacy apply POST sends job ID, learner ID, resumeUrl (JobDetailContent.jsx:572-573; jobService.js:60-66)
- vNext now: VNext POST job/{id}/applications sends roleOptionId and channel; no resume (learner-placement-jobs.tsx:202-217)
- Fix: Create migration contract for resume attachment and role selection, document intentional data drop if no resumes

## G2-15-005-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy direct withdraw uses applicationId and learner ID via API (JobDetailContent.jsx:448-460; jobService.js:99-105)
- vNext now: VNext POST `/api/placements/requests` with reason creates approval request (learner-placement-jobs.tsx:247-261)
- Fix: Specify lifecycle from SUBMITTED→request pending→withdrawn and owner decision vs old direct action

## G2-15-005-050  [P1] GAP  facet F12  effort M
- Legacy: Legacy withdraw permitted only when applicationStatus `APPLIED` (JobDetailContent.jsx:1000-1010)
- vNext now: VNext SUBMITTED permits withdrawal request, even if later stage status not modeled in that component (learner-placement-jobs.tsx:286-300)
- Fix: Check round progression/withdraw window and enforce stage-specific canWithdraw from server

## G2-15-005-052  [P1] MISSING  facet F13  effort M
- Legacy: Legacy unknown lookup full page with `Application status unavailable`, `Check status again` (VerifiedJobDetailContent.jsx:60-89)
- vNext now: VNext route no explicit status unknown UI; DB error becomes boundary (jobs/[jobId]/page.tsx:67-85)
- Fix: Render matching retry state on indeterminate user-application read

## G2-15-005-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy `APPLIED` can withdraw directly and maybe reapply; stage based on old job application state (JobDetailContent.jsx:1000-1010,1060-1063)
- vNext now: VNext `SUBMITTED/WITHDRAWN`, workflow pending approval request, blocked reapply (learner-placement-jobs.tsx:286-358)
- Fix: Define old↔new status machine and reapply policy per stage with concrete owner decision

## G2-15-005-077  [P1] GAP  facet F23  effort L
- Legacy: Legacy hero role/company/logo, eligibility panel, journey, cards, right rail, mobile bar (JobDetailContent.jsx:1094-1344)
- vNext now: VNext breadcrumbs/availability/breakdown/pay/role cards plus history at end (learner-placement-job-detail.tsx:44-300; jobs/[jobId]/page.tsx:82-85)
- Fix: Clone legacy page layout/shell and preserve necessary newer role-detail content subordinate

## G2-15-005-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy `validateJobId` strict positive integer with route-specific help (learnerValidation.js:12-18; JobDetailContent.jsx:823-841)
- vNext now: VNext UUID schema may throw and notFound (learner-historical-drive-service.ts:13-15; jobs/[jobId]/page.tsx:66-74)
- Fix: Map legacy IDs or render explicit recoverable malformed-link state

## G2-15-005-034  [P2] GAP  facet F08  effort M
- Legacy: Legacy apply failure persistent InlineError adjacent Apply button, retry/dismiss (JobDetailContent.jsx:1045-1071)
- vNext now: VNext transient toast `Application not submitted` and refresh (learner-placement-jobs.tsx:231-245)
- Fix: Keep persistent error anchored at failed role action with Dismiss and retry semantics
