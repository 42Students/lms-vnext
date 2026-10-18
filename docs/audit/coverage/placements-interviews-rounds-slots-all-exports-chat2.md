# Chat-2 exhaustive placement interview/round/slot export inventory

Scope: **72 files including `round-action-guards.ts`** matching `src/modules/placements/*interview*/*round*/*slot*` at the 2026-10-19 chat-2 snapshot. This file catalogs exports, **not passed coverage**. For each runtime export the test column must eventually cite a direct behavioral test. N/A applies only to TypeScript-only declarations. Cloud CI, PostgreSQL behaviors and role journeys remain distinct release gates.

| Module | Named export | Direct behavioral test | State |
| --- | --- | --- | --- |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsQuerySchema` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `DriveInterviewsQuery` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/college-drive-interviews-model.ts` | `DRIVE_INTERVIEW_PAGE_SIZE` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsParams` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveInterviewsHref` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-model.ts` | `driveRoundTime` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-drive-interviews-service.ts` | `listCollegeDriveInterviews` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-interview-action-model.ts` | `collegeInterviewActionSchema` (const) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-interview-action-service.ts` | `getCollegeInterviewAppointments` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-interview-action-service.ts` | `mutateCollegeInterview` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-interview-calendar-model.ts` | `collegeInterviewIcs` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/college-interview-directory-service.ts` | `collegeInterviewFilters` (const) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-interview-directory-service.ts` | `listCollegeInterviewDirectory` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `CollegeInterviewLifecycleError` (class) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | TEST AUTHORED |
| `src/modules/placements/college-interview-lifecycle-service.ts` | `finishCollegeInterview` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-round-slot-action-service.ts` | `getCollegeRoundSlotAppointments` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/college-round-slot-action-service.ts` | `mutateCollegeRoundSlotInterview` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/hr-draft-round-duplicate-model.ts` | `duplicateHrDraftRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-draft-round-order-model.ts` | `reorderHrDraftRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-drive-round-presets.ts` | `HR_DRIVE_ROUND_PRESETS` (const) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-drive-round-presets.ts` | `HrRoundPresetId` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-drive-round-presets.ts` | `applyHrRoundPreset` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HR_ROUND_OUTCOMES` (const) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundOutcome` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `HrRoundCount` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultFilters` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-inline-round-results-model.ts` | `hrInlineRoundResultsHref` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotCreateSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `hrInterviewSlotActionSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotTransitionAllowed` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `slotsOverlap` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `parseIstLocalSlot` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-model.ts` | `canRecruiterMutateOwnSlot` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-interview-slot-service.ts` | `listHrInterviewSlots` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/hr-interview-slot-service.ts` | `writeHrInterviewSlot` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/hr-round-editor-model.ts` | `hrRoundFormSchema` (const) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `canRecruiterEditRound` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `duplicateRecruiterRoundName` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-model.ts` | `matchesRecruiterRoundVersion` (function) | \`tests/unit/chat2-interview-hr-break-06.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/hr-round-editor-service.ts` | `editHrJobRound` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/hr-round-editor-service.ts` | `listHrRoundEditorRows` (function) | `tests/unit/chat2-college-recruiter-interview-service-denials.test.ts` (denied/malformed paths; not run) | PARTIAL |
| `src/modules/placements/hr-round-schedule-model.ts` | `RoundScheduleRow` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrScheduledRoundRows` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLabels` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-round-schedule-model.ts` | `hrRoundConflictLinks` (function) | `tests/unit/chat2-round-uncovered-pure-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/hr-today-open-slots-service.ts` | `listRecruiterTodayRoundsNeedingSlots` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | PARTIAL |
| `src/modules/placements/learner-application-interview-links-model.ts` | `OwnApplicationInterviewRound` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-application-interview-links-model.ts` | `OwnApplicationInterviewLink` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-application-interview-links-model.ts` | `ownApplicationInterviewLinks` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
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
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleViewSchema` (const) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/learner-interview-view-model.ts` | `LearnerInterviewScheduleView` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewScheduleCounts` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/learner-interview-view-model.ts` | `learnerInterviewViewHref` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalInputSchema` (const) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `LearnerInterviewWithdrawalTarget` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/learner-interview-withdrawal-model.ts` | `learnerInterviewWithdrawalTarget` (function) | \`tests/unit/chat2-learner-interview-break-07.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `getOwnInterviewWithdrawalTargets` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | PARTIAL |
| `src/modules/placements/learner-interview-withdrawal-service.ts` | `requestOwnInterviewWithdrawal` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | PARTIAL |
| `src/modules/placements/learner-round-confirmation-readiness.ts` | `learnerRoundConfirmationReady` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | TEST AUTHORED |
| `src/modules/placements/learner-round-confirmation-service.ts` | `confirmOwnPlacementRound` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | PARTIAL |
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
| `src/modules/placements/learner-rounds-browse-model.ts` | `learnerRoundScheduledInstant` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/learner-rounds-browse-model.ts` | `learnerRoundUrgency` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/learner-rounds-browse-model.ts` | `browseLearnerCareerRounds` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `recruiterResultTableQuerySchema` (const) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `RecruiterResultRound` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `projectRecruiterRoundResults` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/recruiter-round-results-read-model.ts` | `recruiterResultTableHref` (function) | `tests/unit/chat2-learner-recruiter-round-uncovered-models.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/round-action-guards.ts` | `roundActionSnapshotMatches` (function) | `tests/unit/chat2-round-action-concurrency.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/round-action-guards.ts` | `roundActionJobMutable` (function) | `tests/unit/chat2-round-action-concurrency.test.ts` (written; not run) | TEST AUTHORED |
| `src/modules/placements/round-service.ts` | `listPlacementRounds` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `getPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `createPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `updatePlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `actOnPlacementRound` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `getTpoRoundReorderReadiness` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-service.ts` | `reorderPlacementRounds` (function) | `tests/unit/chat2-tpo-round-service-scope-break-12.test.ts` (malformed ID and scope-denial only; CI pending) | PARTIAL |
| `src/modules/placements/round-venue-booking-service.ts` | `requireAvailableRoundVenue` (function) | `tests/unit/chat2-round-venue-booking-service-transaction.test.ts` (mocked TX) + `tests/integration/chat2-tpo-round-venue-races.test.ts` (PostgreSQL advisory lock, not full service) | PARTIAL |
| `src/modules/placements/super-admin-booked-interviews-range.ts` | `superAdminBookedInterviewWindow` (function) | \`tests/unit/chat2-college-learner-calendar-break-08.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/super-admin-booked-interviews-service.ts` | `listSuperAdminBookedInterviews` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` (direct denial/readiness; not run) | PARTIAL |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `bulkTpoRoundResultSchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `TpoBulkRoundResultOutcome` (type) | N/A (compile-time only) | TYPE ONLY |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `summarizeBulkRoundResults` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-model.ts` | `resolveBulkRoundLearnerTokens` (function) | \`tests/unit/chat2-tpo-round-model-break-02.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-bulk-round-result-service.ts` | `confirmTpoBulkRoundResults` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` + `tests/integration/tpo-confirmed-round-result.test.ts` (PostgreSQL staging, role, foreign college, CAS and audit; not run) | PARTIAL |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `confirmedTpoRoundResultSchema` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `TPO_RESULT_LABELS` (const) | `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canEditTpoRoundResult` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-model.ts` | `canApplyTpoRoundResult` (function) | \`tests/unit/chat2-tpo-round-csv-and-lifecycle-break-03.test.ts\` (CI pending) | TEST AUTHORED |
| `src/modules/placements/tpo-confirmed-round-result-service.ts` | `confirmTpoRoundResult` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` + `tests/integration/tpo-confirmed-round-result.test.ts` (PostgreSQL staging, role, foreign college, CAS and audit; not run) | PARTIAL |
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
| `src/modules/placements/tpo-round-apply-service.ts` | `applyTpoWholeRound` (function) | `tests/unit/chat2-last-round-service-boundaries.test.ts` + `tests/integration/tpo-confirmed-round-result.test.ts` (PostgreSQL preview/STALE/apply-once/audit; not run) | PARTIAL |
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

## October 19 follow-up

The two new round action guard exports are directly exercised by `tests/unit/chat2-round-action-concurrency.test.ts`, with source checks on schedule/complete/cancel job locks. `tests/integration/chat2-round-action-locking-postgres.test.ts` adds actual service scheduling, stale COMPLETE/CANCEL, foreign-college access, closed-job barriers, and persisted event/audit checks. **Authored only, not run.** Other incomplete service rows in this inventory remain OPEN/PARTIAL.

Pure-model coverage advanced on 2026-10-19: direct tests now exercise date/exception precedence, IST time classification, company and role filters, encoded application links, HR round outcome count and suppression of unrecorded results, attendance/conflict scheduling and no-contact leakage. Model unit testing is not a substitute for tenant-scoped DB read services.

Directly imported service denial tests: `chat2-college-recruiter-interview-service-denials.test.ts` tests 12 named college/HR service entry points' malformed IDs, invalid commands, unauthorized actor and no-read/no-write. The role mock tests do **not** cover successful persistence, audit, applicant notifications, capacity, overlapping room/time windows or simultaneous writers. Do not change their PARTIAL statuses to complete without DB tests.

Venue-guard unit suite `chat2-round-venue-booking-service-transaction.test.ts` directly exercises the exported transaction function. It verifies malformed inputs rejected before locking, advisory lock preceding competitor query, half-open interval behavior, fail-closed null/invalid rival evidence and 1001-row capacity rejection. This complements the two-session advisory lock PostgreSQL test but does not yet invoke the full schedule service under a competing two-writer fixture. Written, not run.

All formerly untested exported functions/classes in this inventory now have at least one directly imported, authored behavioural unit test **for a named boundary**, not necessarily a success path. In particular, `chat2-last-round-service-boundaries.test.ts` covers the ten remaining exports' authorization, malformed input, readiness, invalid window and empty authorized job list conditions. They remain PARTIAL where no real persisted success, rollback, tenant or audit test exists. The absence of the string `NO DIRECT BEHAVIOURAL TEST` does not mean full coverage.

TPO stage/apply service DB evidence: existing `tpo-confirmed-round-result.test.ts` already invoked bulk and single confirmed staging, asserted persisted actors/audits, wrong role and foreign-college rejection, and replay CAS denial; the 2026-10-19 addition directly invokes `getTpoRoundApplyPreview`/`applyTpoWholeRound`, asserting tampered/stale SHA-256 preview rejected with no write, valid one-time apply and audit, then fresh-token replay unchanged with exactly one apply audit. **Not run**; tests do not model two simultaneous whole-round writers or multi-row mixed success outcomes.
