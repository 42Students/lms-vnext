# Chat-2 exhaustive placement interview/round/slot export inventory

Scope: **all 71** `src/modules/placements/*interview*/*round*/*slot*` TypeScript files present on the branch at snapshot time. This file catalogs exports, **not passed coverage**. For each runtime export the test column must eventually cite a direct behavioral test. N/A applies only to TypeScript-only declarations. Cloud CI, PostgreSQL behaviors and role journeys remain distinct release gates.

| Module | Named export | Direct behavioral test | State |
| --- | --- | --- | --- |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsQuerySchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-drive-interviews-model.ts` | `DriveInterviewsQuery` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/college-drive-interviews-model.ts` | `DRIVE_INTERVIEW_PAGE_SIZE` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsParams` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveRoundTime` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-drive-interviews-service.ts` | `listCollegeDriveInterviews` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-action-model.ts` | `collegeInterviewActionSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-action-service.ts` | `getCollegeInterviewAppointments` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-action-service.ts` | `mutateCollegeInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-calendar-model.ts` | `collegeInterviewIcs` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-directory-service.ts` | `collegeInterviewFilters` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-directory-service.ts` | `listCollegeInterviewDirectory` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `CollegeInterviewLifecycleError` (class) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `finishCollegeInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-round-slot-action-service.ts` | `getCollegeRoundSlotAppointments` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-round-slot-action-service.ts` | `mutateCollegeRoundSlotInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-draft-round-duplicate-model.ts` | `duplicateHrDraftRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-draft-round-order-model.ts` | `reorderHrDraftRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-drive-round-presets.ts` | `HR_DRIVE_ROUND_PRESETS` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-drive-round-presets.ts` | `HrRoundPresetId` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-drive-round-presets.ts` | `applyHrRoundPreset` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HR_ROUND_OUTCOMES` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundOutcome` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundCount` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultFilters` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultsHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotCreateSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotActionSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotTransitionAllowed` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotsOverlap` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `parseIstLocalSlot` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `canRecruiterMutateOwnSlot` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-service.ts` | `listHrInterviewSlots` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-service.ts` | `writeHrInterviewSlot` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-model.ts` | `hrRoundFormSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-model.ts` | `canRecruiterEditRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-model.ts` | `duplicateRecruiterRoundName` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-model.ts` | `matchesRecruiterRoundVersion` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-service.ts` | `editHrJobRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-service.ts` | `listHrRoundEditorRows` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-schedule-model.ts` | `RoundScheduleRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrScheduledRoundRows` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLabels` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLinks` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-today-open-slots-service.ts` | `listRecruiterTodayRoundsNeedingSlots` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-application-interview-links-model.ts` | `OwnApplicationInterviewRound` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-application-interview-links-model.ts` | `OwnApplicationInterviewLink` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-application-interview-links-model.ts` | `ownApplicationInterviewLinks` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-calendar-model.ts` | `learnerInterviewCalendarInputSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-calendar-model.ts` | `foldLearnerCalendarLine` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-calendar-model.ts` | `learnerInterviewCalendarArtifacts` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-countdown-model.ts` | `InterviewCountdown` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-countdown-model.ts` | `learnerInterviewCountdown` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-deeplink-model.ts` | `resolveOwnInterviewDeepLink` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-focus-model.ts` | `LearnerRoundIdentity` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-focus-model.ts` | `learnerInterviewFocusState` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-mobile-model.ts` | `learnerInterviewMobileSummary` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-reschedule-summary-model.ts` | `learnerInterviewRescheduleSummary` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleViewSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-view-model.ts` | `LearnerInterviewScheduleView` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleCounts` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewViewHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalInputSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `LearnerInterviewWithdrawalTarget` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalTarget` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `getOwnInterviewWithdrawalTargets` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `requestOwnInterviewWithdrawal` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
