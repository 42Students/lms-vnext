# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

## G2-14-030-002  [P1] MISSING  facet F01  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:3-4 updateInterview/getInterviewsForOrganization/getInterviewerNames.
- vNext now: V/components/admin/super-admin-interview-operations.tsx:87-96 actions only Open schedule and .ics download.
- Fix: Expose edit trigger and scoped PUT/PATCH route in admin interview page or related detail.

## G2-14-030-004  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:306-435 fields ordered interviewType, roundDescription, interviewerName, duration, timezone, date, time, conflict alert, mode, location, notes, save/cancel.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-187 Round, Candidate, date/time, duration, mode, location, interviewer, edit reason, footer; no type/description/notes.
- Fix: Rebuild form with all legacy field groups and order; keep vNext reason/version requirements separately.

## G2-14-030-010  [P1] MISSING  facet F04  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:277-299 reads rescheduleRequestJson.reason/note/windows.
- vNext now: V/db/schema/placement-college-interviews.ts:7-27 no rescheduleRequestJson column.
- Fix: Store/project pending reason, note, windows or link to structured learner requests.

## G2-14-030-011  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:128-138 parsePlacementUtcDateTime then dayjs local Date and Time.
- vNext now: V/components/placements/college-interview-appointments.tsx:25-28 local format forced Asia/Kolkata and new Date(start+05:30).
- Fix: Normalize historical UTC edit time and timezone conversion; avoid fixed +05:30 outside India.

## G2-14-030-012  [P1] GAP  facet F04  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:188-201 sends type, description, scheduledDate, duration, mode, location, notes, interviewerName.
- vNext now: V/components/placements/college-interview-appointments.tsx:66-79 sends round/application IDs, scheduledAt, duration, mode, venue/meetingURL, interviewer, reason.
- Fix: Persist interviewType/roundDescription/notes and allow full edit projection.

## G2-14-030-014  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:91-122 loads all organization interviews and dynamically filters possible conflicts.
- vNext now: V/components/admin/super-admin-interview-operations.tsx:11-23 filters lists and bookingConflicts on events; does not use field edits to warn.
- Fix: Compute candidate/interviewer conflicts while form values change, scoped org without cross-tenant leak.

## G2-14-030-015  [P1] MISSING  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:306-317 Interview Type required: SCREENING, TECHNICAL, HR, MANAGERIAL, FINAL.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 no interview type field, round kind fixed externally.
- Fix: Restore type selection or map to per-round type with explicit lossless conversion.

## G2-14-030-016  [P1] MISSING  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:320-329 roundDescription required, whitespace invalid, min10/max500, 3-row textarea and example.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 no roundDescription control.
- Fix: Add round description with exact min/max, placeholder, counter.

## G2-14-030-022  [P1] MISSING  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:421-423 notes optional max1000 showCount rows2.
- vNext now: V/components/placements/college-interview-appointments.tsx:173-187 only `Reason for change` required; notes absent.
- Fix: Restore optional Notes distinct from mandatory change reason.

## G2-14-030-025  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:173-183 unchanged time allowed even if past, changed past rejected with exact error; invalid online URL error.
- vNext now: V/modules/placements/college-interview-action-service.ts:66-69 rejects all past times even unchanged; action-model.ts:9-12 generic https URL error.
- Fix: Permit untouched historical interview edit where safe; preserve exact meeting error.

## G2-14-030-030  [P1] MISSING  facet F09  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:237-254 dirty cancel invokes Modal.confirm `Discard interview changes?`, `Discard changes`, `Keep editing`.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-187 dismiss/cancel immediately without dirty guard.
- Fix: Add dirty snapshot tracking and exact discard confirmation; prevent accidental data loss.

## G2-14-030-033  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:192-205 updateInterview(interview.id,payload,organizationId).
- vNext now: V/modules/placements/college-interview-action-service.ts:66-120 sends action EDIT with expectedVersion and appointment; scoped college admin.
- Fix: Implement equivalent super-admin selected-college update, maintaining full payload fields.

## G2-14-030-035  [P1] MISSING  facet F11  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:50-60,161-165 organizationId required for mutation.
- vNext now: V/modules/admin-ui/super-admin-interview-detail-service.ts:8-21 selected-college required for read; no SA edit counterpart.
- Fix: Use selected college/organization scope in SA edit route, fail closed on missing selection.

## G2-14-030-036  [P1] GAP  facet F11  effort L
- Legacy: LBE/controller/InterviewController.java:80-117 safeguards org and college scope for interview access.
- vNext now: V/modules/placements/college-interview-action-service.ts:1-33 college placement-admin guard; no global SA mutation.
- Fix: Preserve authorized global SA and pinned-college mutation scopes, avoid other colleges.

## G2-14-030-037  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:108-122 conflict soft warning, user can save; backend definitive validation.
- vNext now: V/modules/placements/college-interview-action-service.ts:87-106 hard rejects same venue/interviewer collisions within current job.
- Fix: Restore soft warning at edit and evaluate cross-company candidate clashes and 15min buffer.

## G2-14-030-038  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:85-88,173-186 recognizes RESCHEDULE_REQUESTED and unchanged schedule logic.
- vNext now: V/db/schema/placement-college-interviews.ts:15-27 allowed statuses SCHEDULED,COMPLETED,NO_SHOW,CANCELLED only.
- Fix: Map requested reschedule through learner request records and expose pending state without dropping reason/windows.

## G2-14-030-039  [P1] GAP  facet F12  effort M
- Legacy: LFE/utils/interviewConflicts.js:12-20,90-96 buffer15; same learner across org and interviewer same company.
- vNext now: V/modules/placements/college-interview-action-service.ts:89-105 same interviewer/venue within a job, no 15-minute buffer in shown query.
- Fix: Match buffer and org/company candidate collisions, keep hard server check for overlapping allocations.

## G2-14-030-049  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:25-36 snapshot trims strings and formats date/minute, used to detect dirty cancel.
- vNext now: V/components/placements/college-interview-appointments.tsx:32-50 state initialized in open(), no snapshot/cancel guard.
- Fix: Add dirty-state comparison including whitespace and original timezone precision.

## G2-14-030-051  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:168-172 local date/time converted to UTC ISO string.
- vNext now: V/components/placements/college-interview-appointments.tsx:68-70 appends fixed `+05:30`, timezone not browser-dependent.
- Fix: Resolve local timezone correctly and persist offset-aware ISO without hardcoded offset.

## G2-14-030-053  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/Interview.java:49-93,114-135 interviewType, roundDescription, location, notes, feedback and requested reschedule prior slot/version.
- vNext now: V/db/schema/placement-college-interviews.ts:7-38 scheduledAt,duration,mode,venue,meetingUrl,interviewer,status, outcomeNote/version; no type/description/notes/request history fields.
- Fix: Write migration field map and add or relate missing interview content/previous slot/request history.
