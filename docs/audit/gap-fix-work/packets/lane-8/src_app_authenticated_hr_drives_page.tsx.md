# Work packet: edit src/app/(authenticated)/hr/drives/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-004  [P1] GAP  facet F01  effort S
- Legacy: Only college change clears q/tab; initial load preserves `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:79`
- vNext now: vNext college link carries current filters `src/app/(authenticated)/hr/drives/page.tsx:126`
- Fix: Reset filters on actual college change, preserve on first visit

## G2-11-003-031  [P1] GAP  facet F05  effort M
- Legacy: Counts based on full returned drives including all lifecycles `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:148`
- vNext now: VNext adds request counts to published/closed totals `src/app/(authenticated)/hr/drives/page.tsx:76`
- Fix: Avoid double counting request+job for same drive

## G2-11-003-039  [P1] GAP  facet F07  effort M
- Legacy: Missing capability shows exact Drive access is not switched on title `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:116`
- vNext now: No active college access generic card `src/app/(authenticated)/hr/drives/page.tsx:63`
- Fix: Show capability-specific text

## G2-11-003-041  [P1] GAP  facet F07  effort M
- Legacy: List failure warning Could not load your drives with Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:117`
- vNext now: Server read throws route exception `src/app/(authenticated)/hr/drives/page.tsx:73`
- Fix: Show retryable warning without dropping view

## G2-11-003-042  [P1] GAP  facet F07  effort M
- Legacy: Refresh failure nonblocking stale-list warning `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:140`
- vNext now: SSR read has no retained previous data `src/app/(authenticated)/hr/drives/page.tsx:73`
- Fix: Keep stale list and alert

## G2-11-003-055  [P1] GAP  facet F10  effort S
- Legacy: Legacy openRequests count from direction COLLEGE_TO_COMPANY `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:55`
- vNext now: VNext count via targetParty COMPANY on current job IDs `src/app/(authenticated)/hr/drives/page.tsx:99`
- Fix: Verify equivalent request direction and historical changes

## G2-11-003-067  [P1] GAP  facet F13  effort S
- Legacy: No-drive capability error explicit, no list `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:116`
- vNext now: VNext empty college access not exact capability reason `src/app/(authenticated)/hr/drives/page.tsx:63`
- Fix: Expose required DRIVES permission failure

## G2-11-003-068  [P1] GAP  facet F13  effort S
- Legacy: Network failure retains Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:117`
- vNext now: Backend read unhandled as page render exception `src/app/(authenticated)/hr/drives/page.tsx:73`
- Fix: Recoverable inline warning

## G2-11-003-095  [P1] GAP  facet F20  effort S
- Legacy: Failing fetch preserves previous successful drives (stale warning) `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:68`
- vNext now: SSR cannot preserve last page data on error `src/app/(authenticated)/hr/drives/page.tsx:73`
- Fix: Add stale cache/retry in client boundary

## G2-11-003-100  [P1] GAP  facet F22  effort S
- Legacy: Legacy drive_change_request.direction row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:55`
- vNext now: VNext placementDriveChangeRequests.targetParty counts `src/app/(authenticated)/hr/drives/page.tsx:99`
- Fix: Migrate direction/target and OPEN statuses

## G2-11-003-038  [P2] GAP  facet F07  effort S
- Legacy: API failure message preserved from response text `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:69`
- vNext now: VNext generic Invalid drive filters state `src/app/(authenticated)/hr/drives/page.tsx:56`
- Fix: Differentiate invalid filter vs server load error

## G2-11-003-040  [P2] GAP  facet F07  effort S
- Legacy: Account load error title We couldn't load your account with Retry `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:114`
- vNext now: Redirect dashboard for inactive recruiter `src/app/(authenticated)/hr/drives/page.tsx:45`
- Fix: Restore account load Retry

## G2-11-003-046  [P2] GAP  facet F08  effort S
- Legacy: Stale warning exact `This refresh failed. Showing the last successful drive list.` `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:140`
- vNext now: VNext Invalid drive filters fallback instead `src/app/(authenticated)/hr/drives/page.tsx:57`
- Fix: Restore exact stale warning
