# Work packet (wave 2): edit src/components/courses/assignment-submission-control.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md, docs/audit/gap2/lane-2/assignment-controller.md

## G2-12-007-054  [P2] GAP  facet F15  effort S
- Legacy: Submission persists, content progress marked complete; no client email `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:509-516`
- vNext now: Submission persists via POST/refresh; no direct email `src/components/courses/assignment-submission-control.tsx:190-320`
- Fix: Verify teacher notification and progress markers at service layer

## G2-2-026-008  [P2] GAP  facet F02  effort M
- Legacy: SubmitAssignmentModal.jsx:162-205 opens `Submit Your Work` 720px drawer with intro and full form.
- vNext now: assignment-submission-control.tsx:222-346 renders an inline `<form>` with legend, chips and confirm dialog.
- Fix: For this legacy entry render shared right Drawer, width 720 desktop and full screen below 768, preserving field order.

## G2-2-026-014  [P2] GAP  facet F03  effort M
- Legacy: SubmitAssignmentModal.jsx:355-385 adds/removes any number of repository and external links.
- vNext now: assignment-submission-control.tsx:295-313 renders one URL Input in LINK mode.
- Fix: Support repeatable independent links and remove actions; keep asset ordering.

## G2-2-026-043  [P2] GAP  facet F09  effort S
- Legacy: SubmitAssignmentModal.jsx:145-160 discard confirmation has `Discard`/`Keep editing` and explicit unsaved-work explanation.
- vNext now: assignment-submission-control.tsx:333-345 has in-app link discard Dialog with shorter message.
- Fix: Align unsaved-work prompt wording, button order and all drawer close/back paths.

## G2-2-026-068  [P2] GAP  facet F13  effort S
- Legacy: SubmitAssignmentModal.jsx:473-494 disables submission on missing/expired deadline with precise 3s toast.
- vNext now: assignment-submission-control.tsx:131-165 validates method/text/url; deadline enforced in server service.
- Fix: Show disabled `Submission unavailable/closed` before network roundtrip and preserve precise reason.

## G2-2-026-076  [P2] GAP  facet F16  effort M
- Legacy: SubmitAssignmentModal.jsx:175-178 uses width720 desktop and 100% when innerWidth <768.
- vNext now: assignment-submission-control.tsx:235-269 lays out 2-column buttons on mobile, switches to md:flex.
- Fix: Use legacy full-width drawer/field layout below 768 and tap-safe action controls.

## G2-2-026-079  [P2] GAP  facet F17  effort M
- Legacy: SubmitAssignmentModal.jsx:355-385 gives numbered aria-label per repeated link and remove control.
- vNext now: assignment-submission-control.tsx:296-313 has one labelled URL input; methods group at :235-239.
- Fix: Label each dynamic asset and remove button for screen readers; support keyboard add/remove.

## G2-2-026-080  [P2] GAP  facet F18  effort S
- Legacy: SubmitAssignmentModal.jsx:162-205 `Submit Your Work` and intro `Submitting for`.
- vNext now: assignment-submission-control.tsx:228-233 retains `Submit Your Work` but omits `Submitting for <title>`.
- Fix: Restore assignment title context adjacent to submission heading.

## G2-2-026-081  [P2] GAP  facet F18  effort S
- Legacy: SubmitAssignmentModal.jsx:220-235 says `PDF Uploads`/`File Uploads` and `Add another PDF/file`.
- vNext now: assignment-submission-control.tsx:265-269 says `Combine work` or `File Upload`.
- Fix: Map all five exact legacy method headings and repeating-action labels.

## G2-2-026-082  [P2] GAP  facet F18  effort S
- Legacy: SubmitAssignmentModal.jsx:475-492 exact deadline errors on submit.
- vNext now: assignment-submission-control.tsx:316-323 generic prefix `Assignment was not submitted.` around service error.
- Fix: Show exact stale/missing deadline messages before disabling and from API errors.

## G2-2-026-103  [P2] GAP  facet F23  effort S
- Legacy: SubmitAssignmentModal.jsx:207-253 exposes all allowed methods simultaneously.
- vNext now: assignment-submission-control.tsx:235-290 adds selectable filter chips; extra UX is not inherently equivalent to multi-asset composer.
- Fix: Document whether method switching is intentional; do not treat it as multi-part parity.
