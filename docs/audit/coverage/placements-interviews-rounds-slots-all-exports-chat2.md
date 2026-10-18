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
