# Work packet: edit src/components/hr/hr-drive-draft-form.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md, docs/audit/gap2/lane-5/l12-u025-recruiter-plan-drive-controller.md

## G2-11-004-006  [P1] GAP  facet F02  effort M
- Legacy: Main split `recruiter-plan-drive__form-column` and review aside `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:356`
- vNext now: Preview lower section and action buttons, not persistent right Card `src/components/hr/hr-drive-draft-form.tsx:459`
- Fix: Reinstate two-column form/always-visible preview at desktop

## G2-11-004-013  [P1] GAP  facet F03  effort S
- Legacy: Round row Remove action allows deleting all rounds `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:399`
- vNext now: Remove disabled if only one round `src/components/hr/hr-drive-draft-form.tsx:449`
- Fix: Allow zero rounds for optional process

## G2-11-004-028  [P1] GAP  facet F05  effort M
- Legacy: Passing year multi-select tags, any year, e.g. 2027 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:410`
- vNext now: Single year Input YYYY `src/components/hr/hr-drive-draft-form.tsx:385`
- Fix: Support array of passing years, not one value

## G2-11-004-049  [P1] GAP  facet F07  effort M
- Legacy: Server errors mapped to jobTitle, ctcLpa, minCgpa, passingYears `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:293`
- vNext now: vNext FriendlyFetchError flat setNotice `src/components/hr/hr-drive-draft-form.tsx:223`
- Fix: Map per-field API problem details into visible errors

## G2-11-004-054  [P1] GAP  facet F08  effort M
- Legacy: Autoapproved shows Approved. The placement cell sets the dates and opens it to students. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:279`
- vNext now: Success panel says Sent to the placement cell for review even when auto-approved status `src/components/hr/hr-drive-draft-form.tsx:234`
- Fix: Return and render autoapproved outcome correctly

## G2-11-004-064  [P1] GAP  facet F10  effort M
- Legacy: POST `/plan-drive` with `form`, 201 response containing per-college `jobId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47`
- vNext now: POST `/api/placements/recruiter/drives/requests` with draft and submissionId, returns request ID `src/components/hr/hr-drive-draft-form.tsx:190`
- Fix: Map request approval/jobId receipts and error statuses

## G2-11-004-077  [P1] MISSING  facet F12  effort S
- Legacy: Uploaded JD only PDF/Word <=5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- vNext now: Upload disabled entirely `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Enforce MIME/size on signed storage integration

## G2-11-004-086  [P1] MISSING  facet F14  effort S
- Legacy: Legacy preview displays job description link to students `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:429`
- vNext now: No uploaded file link preview `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Show safe signed document link in preview

## G2-11-004-094  [P1] GAP  facet F16  effort S
- Legacy: Preview remains alongside even before validation `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:424`
- vNext now: showPreview false until Preview and validate action `src/components/hr/hr-drive-draft-form.tsx:66`
- Fix: Make preview continuously live

## G2-11-004-096  [P1] GAP  facet F17  effort S
- Legacy: On validation error scrolls to first field `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:254`
- vNext now: VNext sets generic notice, shows preview `src/components/hr/hr-drive-draft-form.tsx:179`
- Fix: Scroll/focus first failing form control

## G2-11-004-121  [P1] GAP  facet F23  effort S
- Legacy: Live right-card preview from first render `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:425`
- vNext now: Preview & validate button and gated preview `src/components/hr/hr-drive-draft-form.tsx:465`
- Fix: Return always-on preview

## G2-11-004-046  [P2] GAP  facet F07  effort S
- Legacy: Error Enter a role title attached Ant Form.Item `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:361`
- vNext now: Zod issues in common Review the draft Alert `src/components/hr/hr-drive-draft-form.tsx:493`
- Fix: Attach field errors and focus first failed field

## G2-11-004-050  [P2] GAP  facet F07  effort S
- Legacy: Failed request fallback Could not send this request. Your draft is saved; try again. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:293`
- vNext now: Unknown result says status could not be confirmed; check Drives before resending `src/components/hr/hr-drive-draft-form.tsx:225`
- Fix: Preserve legacy fallback or document deliberate idempotency safety difference

## G2-11-004-055  [P2] GAP  facet F08  effort S
- Legacy: Success page titled Drive approved or Request sent `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:314`
- vNext now: Single success panel heading Sent to the placement cell for review `src/components/hr/hr-drive-draft-form.tsx:234`
- Fix: Render approved/request branch headings

## G2-12-025-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy validation scrolls to first Form field, saves draft on HTTP error. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:250-295`
- vNext now: vNext Zod validation and notice, draft retained. `src/components/hr/hr-drive-draft-form.tsx:64-76,98-150`
- Fix: Scroll/focus first failed field and preserve draft receipt.

## G2-12-025-023  [P2] GAP  facet F08  effort M
- Legacy: Legacy successful send clears draft only when created real job, errors preserve it. `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:263-295`
- vNext now: vNext draft local persistence with submittedRef, but no multi-college skip case. `src/components/hr/hr-drive-draft-form.tsx:64-76,125-150`
- Fix: Only clear on durable request receipt.
