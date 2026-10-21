# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md (part 2 of 2)

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

## G2-14-030-054  [P1] GAP  facet F22  effort M
- Legacy: LBE/model/Interview.java:52-58 includes RESCHEDULE_REQUESTED and CONFIRMED statuses.
- vNext now: V/db/schema/placement-college-interviews.ts:15-36 status check only SCHEDULED/COMPLETED/NO_SHOW/CANCELLED.
- Fix: Represent CONFIRMED and pending reschedule separately or document status remapping.

## G2-14-030-023  [P2] MISSING  facet F07  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:308-309 exact `Please select interview type`.
- vNext now: V/modules/placements/college-interview-action-model.ts:3-20 no interviewType validator.
- Fix: Add field-level required message verbatim.

## G2-14-030-024  [P2] MISSING  facet F07  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:324-326 `Please describe what this round is about`; `Please add at least a short description (min 10 characters)`.
- vNext now: V/modules/placements/college-interview-action-model.ts:3-20 no roundDescription validation.
- Fix: Add whitespace/min10 field errors and 500-char bound.

## G2-14-030-026  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:367-375 exact missing date/time errors and URL validator line 410.
- vNext now: V/components/placements/college-interview-appointments.tsx:66-70 invalid time generic `Enter a valid date and time.`.
- Fix: Restore separate required date/time messages and https meeting field error.

## G2-14-030-027  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:208-230 server errors mapped by snake_case to AntD form fields, inline dismissible `Interview changes were not saved` Alert.
- vNext now: V/components/placements/college-interview-appointments.tsx:52-64 catches generic error and displays single Banner.
- Fix: Wire server Zod field errors to fields, dismissible alert and accurate fallback.

## G2-14-030-028  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:203-206 `Reschedule applied. Candidate has been notified.` if pending request+date changed else `Interview updated successfully`.
- vNext now: V/components/placements/college-interview-appointments.tsx:60-62 `Interview <status>. The learner was notified.`.
- Fix: Use exact conditional success messages based on reschedule status/date change.

## G2-14-030-029  [P3] GAP  facet F08  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:237-240 cancelling while saving shows `Wait for the interview update to finish saving.`.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-138 disables dismiss while busy but no info message.
- Fix: Add legacy info notification on attempted busy cancel.
