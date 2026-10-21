# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

22 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l14-u030-super-admin-interview-edit-form.md

## G2-14-030-003  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:266-305 save error, reschedule notice and candidate/job summary before fields.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-187 dialog starts at Round and Candidate selectors, no request banner or context summary.
- Fix: Recreate notice, candidate/job callout and correct section order before form fields.

## G2-14-030-005  [P2] MISSING  facet F03  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:277-299 amber `Reschedule requested` banner with reason, note, free windows.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 only edit form reason; no request provenance banner.
- Fix: Render pending request banner with reason, note and proposed windows.

## G2-14-030-006  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:301-304 candidate name and job title in muted bordered strip.
- vNext now: V/components/placements/college-interview-appointments.tsx:141-154 Candidate select, not summary.
- Fix: Add immutable candidate and job label strip on edit.

## G2-14-030-007  [P2] GAP  facet F03  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:331-345 interviewer tooltip and autocomplete using existing names.
- vNext now: V/components/placements/college-interview-appointments.tsx:173-175 plain text input and no tooltip/autocomplete.
- Fix: Add interviewer autocomplete, tooltip and same-name clash caution.

## G2-14-030-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:363-365 dynamic `Times shown in your local timezone (Asia/Kolkata)` line.
- vNext now: V/components/placements/college-interview-appointments.tsx:22-28,158-162 fixed Date & time (IST).
- Fix: Reflect browser actual local timezone or explicitly convert and label IST policy.

## G2-14-030-009  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:85-88,139-152 initial candidate/interview values; defaults SCREENING, 60 minutes, ONLINE.
- vNext now: V/components/placements/college-interview-appointments.tsx:32-50 defaults first round/candidate, 30min, ON_CAMPUS.
- Fix: Map legacy default values for edit/new and preserve actual persisted values.

## G2-14-030-013  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:65-81 interviewerName autocomplete loads all suggestions from getInterviewerNames.
- vNext now: V/components/placements/college-interview-appointments.tsx:173-175 plain text input no option list.
- Fix: Add case-insensitive filtered suggestion list with keyboard semantics.

## G2-14-030-017  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:331-345 optional interviewerName max255, autocomplete, allowClear.
- vNext now: V/modules/placements/college-interview-action-model.ts:3-7 interviewer max200, nullable.
- Fix: Align 255 character cap, suggestions, and explicit clear-to-null.

## G2-14-030-018  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:347-361 duration required one of 15,30,45,60,90,120,180.
- vNext now: V/components/placements/college-interview-appointments.tsx:158-164 numeric min5 max480 with default30.
- Fix: Restore discrete duration choices and 60 default or document intentional flexibility.

## G2-14-030-019  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:367-377 separate required Date with disabled past day and TimePicker HH:mm step5.
- vNext now: V/components/placements/college-interview-appointments.tsx:158-163 combined datetime-local no 5-minute step.
- Fix: Match date/time controls, 5-minute increments and past date disabled.

## G2-14-030-020  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:389-398 Mode ONLINE/OFFLINE, default ONLINE; mode switch clears location.
- vNext now: V/components/placements/college-interview-appointments.tsx:165-173 ON_CAMPUS/VIRTUAL, defaults ON_CAMPUS, mode switch leaves previous values.
- Fix: Map ONLINE/OFFLINE labels and clear stale location on switch.

## G2-14-030-021  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:400-419 required Meeting Link https URL or Venue Address, max500, contextual placeholder.
- vNext now: V/modules/placements/college-interview-action-model.ts:3-12 venue max400, meetingURL max2000; V/components/placements/college-interview-appointments.tsx:168-173 generic input no legacy placeholder.
- Fix: Align contextual labels/placeholders and caps/https errors per mode.

## G2-14-030-032  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:65-81 and 91-104 API GET names and organization interviews on mount.
- vNext now: V/components/placements/college-interview-appointments.tsx:32-52 receives candidates/appointments as props; no suggestion/conflict fetch.
- Fix: Add scoped interviewer directory and conflict preflight data sources.

## G2-14-030-040  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:256,266-276 null interview yields null, error dismissible alert.
- vNext now: V/components/placements/college-interview-appointments.tsx:93-99 no candidates/rounds info Banner; 130-138 Dialog with error Banner.
- Fix: Add old missing-context, no-interview and closable error states.

## G2-14-030-044  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:259-435 AntD vertical Form with full-width DatePicker/TimePicker and paired footer.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 responsive md two-column date/duration, native input, mobile dialog.
- Fix: Match old compact vertical layout and responsive 375/768/1280 modal handling.

## G2-14-030-045  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:331-345 AutoComplete keyboard name suggestions; Form.Item errors and Modal.confirm focus.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-187 labelled inputs/dialog but plain interviewer input and no discard confirmation.
- Fix: Restore autocomplete keyboard semantics, focus return and confirmation accessibility.

## G2-14-030-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:320-328 `What this round is about` and sample; 331-345 `Interviewer(s)` tooltip; 421-423 `Notes (Optional)`.
- vNext now: V/components/placements/college-interview-appointments.tsx:140-187 `Round`, `Interviewer (optional)`, `Reason for change`; other strings absent.
- Fix: Use exact legacy headings, helper and placeholders field by field.

## G2-14-030-047  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:427-431 `Apply new slot`/`Save changes`, `Cancel`.
- vNext now: V/components/placements/college-interview-appointments.tsx:134-137 `Save interview` and `Cancel`.
- Fix: Use conditional primary label when pending reschedule request.

## G2-14-030-048  [P2] GAP  facet F19  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:65-104 fetches names and full org interviews once per mount, including unbounded conflict scan.
- vNext now: V/components/admin/super-admin-interview-operations.tsx:15-23 bookingConflicts in useMemo; list truncates to 2000 UI lines64.
- Fix: Fetch complete conflict scope or server conflict probe; never assume first 2000 sufficient.

## G2-14-030-050  [P2] GAP  facet F20  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:161-189 loadingRef synchronously prevents double submission; unchanged past time allowed.
- vNext now: V/components/placements/college-interview-appointments.tsx:52-69 busy guard, future-only check and version CAS in action-model.ts:16-17.
- Fix: Preserve single-submit guard and allow safe unchanged historical field edits.

## G2-14-030-052  [P2] GAP  facet F21  effort M
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:3-9 imports service update, org interview lookup, interviewer names, conflict utility, dayjs/UTC.
- vNext now: V/components/placements/college-interview-appointments.tsx:1-16 uses apiFetch, collegeInterviewIcs and router refresh.
- Fix: Restore equivalent interviewer lookup, overlap/notifications integrations with new APIs.

## G2-14-030-041  [P3] GAP  facet F13  effort S
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:65-81 interviewer name fetch failures degrade gracefully to plain text input.
- vNext now: V/components/placements/college-interview-appointments.tsx:173-175 always plain text input.
- Fix: Provide suggestions with graceful non-blocking failure fallback.
