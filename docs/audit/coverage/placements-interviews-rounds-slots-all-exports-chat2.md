# Chat-2 exhaustive placement interview/round/slot export inventory

Scope: **all 71** `src/modules/placements/*interview*/*round*/*slot*` TypeScript files present on the branch at snapshot time. This file catalogs exports, **not passed coverage**. For each runtime export the test column must eventually cite a direct behavioral test. N/A applies only to TypeScript-only declarations. Cloud CI, PostgreSQL behaviors and role journeys remain distinct release gates.

| Module | Named export | Direct behavioral test | State |
| --- | --- | --- | --- |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsQuerySchema` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `DriveInterviewsQuery` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/college-drive-interviews-model.ts` | `DRIVE_INTERVIEW_PAGE_SIZE` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsParams` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsHref` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveRoundTime` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-service.ts` | `listCollegeDriveInterviews` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-action-model.ts` | `collegeInterviewActionSchema` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-interview-action-service.ts` | `getCollegeInterviewAppointments` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-action-service.ts` | `mutateCollegeInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-calendar-model.ts` | `collegeInterviewIcs` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-interview-directory-service.ts` | `collegeInterviewFilters` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-directory-service.ts` | `listCollegeInterviewDirectory` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `CollegeInterviewLifecycleError` (class) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `finishCollegeInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-round-slot-action-service.ts` | `getCollegeRoundSlotAppointments` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/college-round-slot-action-service.ts` | `mutateCollegeRoundSlotInterview` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-draft-round-duplicate-model.ts` | `duplicateHrDraftRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-draft-round-order-model.ts` | `reorderHrDraftRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-drive-round-presets.ts` | `HR_DRIVE_ROUND_PRESETS` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-drive-round-presets.ts` | `HrRoundPresetId` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-drive-round-presets.ts` | `applyHrRoundPreset` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HR_ROUND_OUTCOMES` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundOutcome` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundCount` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultFilters` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultsHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotCreateSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotActionSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotTransitionAllowed` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotsOverlap` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `parseIstLocalSlot` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `canRecruiterMutateOwnSlot` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-service.ts` | `listHrInterviewSlots` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-interview-slot-service.ts` | `writeHrInterviewSlot` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/hr-round-editor-model.ts` | `hrRoundFormSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `canRecruiterEditRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `duplicateRecruiterRoundName` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `matchesRecruiterRoundVersion` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
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
| `src/modules/placements/learner-interview-calendar-model.ts` | `learnerInterviewCalendarInputSchema` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-calendar-model.ts` | `foldLearnerCalendarLine` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-calendar-model.ts` | `learnerInterviewCalendarArtifacts` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-countdown-model.ts` | `InterviewCountdown` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-countdown-model.ts` | `learnerInterviewCountdown` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-deeplink-model.ts` | `resolveOwnInterviewDeepLink` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-focus-model.ts` | `LearnerRoundIdentity` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-focus-model.ts` | `learnerInterviewFocusState` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-mobile-model.ts` | `learnerInterviewMobileSummary` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-reschedule-summary-model.ts` | `learnerInterviewRescheduleSummary` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleViewSchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-view-model.ts` | `LearnerInterviewScheduleView` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleCounts` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewViewHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalInputSchema` (const) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `LearnerInterviewWithdrawalTarget` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalTarget` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `getOwnInterviewWithdrawalTargets` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `requestOwnInterviewWithdrawal` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-round-confirmation-readiness.ts` | `learnerRoundConfirmationReady` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-round-confirmation-service.ts` | `confirmOwnPlacementRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-round-search-query-model.ts` | `learnerRoundSearchQuerySchema` (const) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-round-search-query-model.ts` | `learnerRoundSearchFromQuery` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-round-search-query-model.ts` | `learnerRoundSearchHref` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-round-time-signal.ts` | `LearnerRoundTimeSignal` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-round-time-signal.ts` | `learnerRoundTimeSignal` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-round-time-signal.ts` | `learnerRoundTimeLabel` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-round-visibility-policy.ts` | `CareerRoundView` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-round-visibility-policy.ts` | `isCareerRoundVisible` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-rounds-browse-model.ts` | `LearnerRoundBrowseSource` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-rounds-browse-model.ts` | `LearnerRoundTimeBucket` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-rounds-browse-model.ts` | `LearnerRoundBrowseFilters` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-rounds-browse-model.ts` | `learnerRoundScheduledInstant` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-rounds-browse-model.ts` | `learnerRoundUrgency` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/learner-rounds-browse-model.ts` | `browseLearnerCareerRounds` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `recruiterResultTableQuerySchema` (const) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `RecruiterResultRound` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `projectRecruiterRoundResults` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `recruiterResultTableHref` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/round-service.ts` | `listPlacementRounds` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `getPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `createPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `updatePlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `actOnPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `getTpoRoundReorderReadiness` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `reorderPlacementRounds` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-venue-booking-service.ts` | `requireAvailableRoundVenue` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/super-admin-booked-interviews-range.ts` | `superAdminBookedInterviewWindow` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/super-admin-booked-interviews-service.ts` | `listSuperAdminBookedInterviews` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `bulkTpoRoundResultSchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `TpoBulkRoundResultOutcome` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `summarizeBulkRoundResults` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `resolveBulkRoundLearnerTokens` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-service.ts` | `confirmTpoBulkRoundResults` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `confirmedTpoRoundResultSchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `TPO_RESULT_LABELS` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canEditTpoRoundResult` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canApplyTpoRoundResult` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-service.ts` | `confirmTpoRoundResult` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/tpo-drive-round-presets.ts` | `TPO_DRIVE_ROUND_PRESETS` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-drive-round-presets.ts` | `TpoRoundPresetKey` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-drive-round-presets.ts` | `isTpoRoundPresetKey` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-drive-round-presets.ts` | `plannedTpoRoundRows` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `AppliedRoundDecision` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundShares` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `AppliedRoundBranchDecision` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-failure-round-share-model.ts` | `summarizeFailedRoundSharesByBranch` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `tpoInterviewWindowSchema` (const) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `InterviewRoundFact` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-interview-readiness-model.ts` | `projectTpoInterviewReadiness` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-readiness-service.ts` | `getTpoInterviewReadiness` (function) | `tests/unit/chat2-tpo-read-service-denial-break-10.test.ts` (entrypoint denial only; DB tests pending) | PARTIAL |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `tpoInterviewRescheduleSchema` (const) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `validInterviewWindow` (function) | \`tests/unit/chat2-tpo-interview-plan-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-reschedule-model.ts` | `overlappingInterviewVenue` (function) | \`tests/unit/chat2-tpo-interview-plan-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-reschedule-service.ts` | `rescheduleTpoInterview` (function) | `tests/unit/chat2-tpo-service-denial-break-09.test.ts` (**denial-only; DB flows missing**) | PARTIAL |
| `src/modules/placements/tpo-interview-slot-model.ts` | `tpoInterviewSlotActionSchema` (const) | \`tests/unit/chat2-tpo-interview-plan-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-slot-model.ts` | `sameInterviewRoom` (function) | \`tests/unit/chat2-tpo-interview-plan-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-slot-model.ts` | `planInterviewDay` (function) | \`tests/unit/chat2-tpo-interview-plan-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-interview-slot-service.ts` | `getTpoInterviewSlotWorkspace` (function) | `tests/unit/chat2-tpo-service-denial-break-09.test.ts` (**denial-only; DB flows missing**) | PARTIAL |
| `src/modules/placements/tpo-interview-slot-service.ts` | `mutateTpoInterviewSlots` (function) | `tests/unit/chat2-tpo-service-denial-break-09.test.ts` (**denial-only; DB flows missing**) | PARTIAL |
| `src/modules/placements/tpo-live-round-job-link-model.ts` | `tpoLiveRoundJobHref` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-live-round-search-model.ts` | `tpoLiveRoundSearchSchema` (const) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-live-round-search-model.ts` | `filterTpoLiveRoundSearch` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-live-round-timing-model.ts` | `tpoLiveRoundTiming` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-live-round-venue-model.ts` | `tpoLiveRoundVenueLabel` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-recruiter-slot-review-service.ts` | `listTpoRecruiterProposedSlots` (function) | `tests/unit/chat2-tpo-read-service-denial-break-10.test.ts` (entrypoint denial only; DB tests pending) | PARTIAL |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyPreviewCsv` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-apply-csv-model.ts` | `roundApplyReportCsv` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-apply-model.ts` | `roundApplyInputSchema` (const) | \`tests/unit/chat2-tpo-round-state-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-apply-model.ts` | `RoundApplyRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-apply-model.ts` | `summarizeRoundApply` (function) | \`tests/unit/chat2-tpo-round-state-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-apply-model.ts` | `roundApplyPreviewToken` (function) | \`tests/unit/chat2-tpo-round-state-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-apply-service.ts` | `getTpoRoundApplyPreview` (function) | `tests/unit/chat2-tpo-service-denial-break-09.test.ts` (**denial-only; DB flows missing**) | PARTIAL |
| `src/modules/placements/tpo-round-apply-service.ts` | `applyTpoWholeRound` (function) | **NO DIRECT BEHAVIOURAL TEST — GAP** | OPEN |
| `src/modules/placements/tpo-round-calendar-model.ts` | `tpoRoundCalendarMutationSchema` (const) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-calendar-model.ts` | `parseIstRoundLocalTime` (function) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-calendar-service.ts` | `listTpoCalendarRoundChoices` (function) | `tests/unit/chat2-tpo-calendar-scope-break-13.test.ts` (wrong roles, account status, tenant and invalid payload; CI pending) | PARTIAL |
| `src/modules/placements/tpo-round-calendar-service.ts` | `decideTpoCalendarRound` (function) | `tests/unit/chat2-tpo-calendar-scope-break-13.test.ts` (wrong roles, account status, tenant and invalid payload; CI pending) | PARTIAL |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TPO_ROUND_ATTENDANCE_STATES` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TpoRoundAttendanceState` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TpoRoundRosterSourceStudent` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TpoRoundApplicationDetail` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `TpoRoundRosterRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-drive-day-model.ts` | `buildTpoRoundDriveDayRoster` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-drive-day-service.ts` | `getTpoRoundDriveDay` (function) | `tests/unit/chat2-tpo-read-service-denial-break-10.test.ts` (entrypoint denial only; DB tests pending) | PARTIAL |
| `src/modules/placements/tpo-round-facts-model.ts` | `TpoRoundFactInput` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-facts-model.ts` | `projectTpoRoundFacts` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsvQuerySchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `TpoRoundFailureCsvRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-failure-csv-model.ts` | `tpoRoundFailureCsv` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-import-model.ts` | `roundImportActionSchema` (const) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-import-model.ts` | `ImportRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-import-model.ts` | `uniqueTpoRoundImportRoster` (function) | `tests/unit/chat2-ledger-round-import-and-scheduling.test.ts` (duplicate, conflicting evidence, no mutation; CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-import-model.ts` | `parseTpoRoundImport` (function) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-import-model.ts` | `ROUND_IMPORT_TEMPLATE` (const) | \`tests/unit/chat2-ledger-round-import-and-scheduling.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-import-service.ts` | `previewTpoRoundImport` (function) | `tests/unit/chat2-tpo-round-import-service-break-14.test.ts` (role/tenant, invalid command/URL; DB pipeline untested; CI pending) | PARTIAL |
| `src/modules/placements/tpo-round-import-service.ts` | `stageTpoRoundImport` (function) | `tests/unit/chat2-tpo-round-import-service-break-14.test.ts` (role/tenant, invalid command/URL; DB pipeline untested; CI pending) | PARTIAL |
| `src/modules/placements/tpo-round-reorder-model.ts` | `roundReorderLockMessage` (function) | \`tests/unit/chat2-tpo-round-state-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-reorder-model.ts` | `moveRound` (function) | \`tests/unit/chat2-tpo-round-state-break-01.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-entry-model.ts` | `tpoRoundResultEntryFormSchema` (const) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultTableQuerySchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-table-model.ts` | `RoundResultEntry` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-round-result-table-model.ts` | `projectTpoRoundResultTable` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-table-model.ts` | `tpoRoundResultViewSchema` (const) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-table-model.ts` | `filterTpoRoundResultRows` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-round-result-table-service.ts` | `getTpoRoundResultTable` (function) | `tests/unit/chat2-tpo-read-service-denial-break-10.test.ts` (entrypoint denial only; DB tests pending) | PARTIAL |

## Chat-2 pure model behavioral coverage additions — 2026-10-18

| Runtime exports | Unit test | Branches covered |
| --- | --- | --- |
| `HR_DRIVE_ROUND_PRESETS`, `applyHrRoundPreset` | `tests/unit/chat2-hr-round-schedule-and-filter-ledger.test.ts` | Exact legacy editable preset rounds, no source mutation, unknown preset unchanged |
| `HR_ROUND_OUTCOMES`, `hrInlineRoundResultFilters`, `hrInlineRoundResultsHref` | Same test | Exact categories/counts including no-record case, encoded job+round+outcome filters |
| `hrScheduledRoundRows`, `hrRoundConflictLabels`, `hrRoundConflictLinks` | Same test | Deterministic overlapping half-open intervals, invalid/unknown duration, adjacent windows, exact role-facing labels, encoded links |
| `tpoInterviewRescheduleSchema`, `validInterviewWindow`, `overlappingInterviewVenue` | `tests/unit/chat2-interview-reschedule-security.test.ts` | Credential-free HTTPS-only meetings, valid duration and venue overlap guards |

These records supplement existing export rows; CI and integration results are still pending. The HR round schedule model was also hardened against fractional interview durations, which previously created invented fractional-minute end times. No other module/branch was modified.
