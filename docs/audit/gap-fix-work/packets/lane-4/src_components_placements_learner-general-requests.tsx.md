# Work packet: edit src/components/placements/learner-general-requests.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-011  [P1] MISSING  facet F03  effort S
- Legacy: Upload.Dragger icon + attached filename and progress text `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:239-264`
- vNext now: Proof link URL input, no upload dropzone icon or name `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Implement signed upload and attachment affordance

## G2-12-005-028  [P1] MISSING  facet F06  effort S
- Legacy: Offer letter optional drag-and-drop file upload `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:259-264`
- vNext now: Proof URL only, no file attachment UI `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Offer approved signed upload with generated secure proof URL

## G2-12-005-039  [P1] MISSING  facet F09  effort S
- Legacy: Dirty request close confirm `Discard this request?` and detailed warning `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:123-136`
- vNext now: No close/cancel/dirty guard for request draft `src/components/placements/learner-general-requests.tsx:57-99`
- Fix: Add dirty discard confirmation

## G2-12-005-048  [P1] GAP  facet F12  effort S
- Legacy: Only 3 learner registration options; TPO-only Entrepreneurship/Exams read-only `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:10-21`
- vNext now: Change-choice request offers Entrepreneurship/Exams `src/components/placements/learner-general-requests.tsx:64-68`
- Fix: Prevent learner from selecting TPO-only outcomes via change request if still restricted

## G2-12-005-057  [P1] MISSING  facet F14  effort S
- Legacy: Offer letter uploaded via `uploadFileViaPresign` folder off-campus-offer-letters `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106,259-264`
- vNext now: Only HTTPS proof link input `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Add signed upload, file constraints, removal and attachment label

## G2-12-005-080  [P1] MISSING  facet F21  effort S
- Legacy: External R2 presign uploader handles evidence file `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106`
- vNext now: No uploader; accepts externally hosted HTTPS proof URLs `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Use vNext approved signed storage API for off-campus evidence

## G2-12-005-089  [P1] GAP  facet F23  effort S
- Legacy: Legacy file-based proof attachment `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106`
- vNext now: URL proof instead, no in-app file upload `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Document intentional signed-URL-first policy and need to capture file source

## G2-12-005-031  [P2] GAP  facet F07  effort S
- Legacy: Short reason error `Please explain` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:268-269`
- vNext now: Generic `Complete the required details for this request before sending.` `src/components/placements/learner-general-requests.tsx:43-46`
- Fix: Focus reason and match minimum-length wording

## G2-12-005-036  [P2] GAP  facet F08  effort S
- Legacy: Request success toast `Sent to the placement cell` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:147-154`
- vNext now: Inline `Request sent to your placement cell. You can track it below.` `src/components/placements/learner-general-requests.tsx:48-55`
- Fix: Restore exact toast text, optionally retain inline accessibility

## G2-12-005-037  [P2] MISSING  facet F08  effort S
- Legacy: Upload `Letter attached`, error with separate-sharing fallback `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:95-104`
- vNext now: No file operation/toasts, only proof URL `src/components/placements/learner-general-requests.tsx:82-84`
- Fix: Reintroduce upload progress/success/fallback feedback
