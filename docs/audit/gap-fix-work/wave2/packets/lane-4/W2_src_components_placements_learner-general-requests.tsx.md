# Work packet (wave 2): edit src/components/placements/learner-general-requests.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-009  [P2] GAP  facet F03  effort S
- Legacy: Your requests heading and inline New request button `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:207-212`
- vNext now: Other placement requests always-expanded form and separate history, no New request launcher `src/components/placements/learner-general-requests.tsx:57-60`
- Fix: Restore action placement and trigger

## G2-12-005-010  [P2] GAP  facet F03  effort S
- Legacy: Legacy statuses displayed as colored chips with waiting/approved/not approved `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:207-231`
- vNext now: History status rendered raw humanized text, no status chips `src/components/placements/learner-general-requests.tsx:91-97`
- Fix: Render exact status chip labels/tones

## G2-12-005-015  [P2] GAP  facet F04  effort S
- Legacy: Request decisionReason appears under `Reply:` with relative Sent time `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:216-226`
- vNext now: General request history shows `Placement cell:` note, no requested-at time `src/components/placements/learner-general-requests.tsx:91-97`
- Fix: Restore relative time/status and Reply label

## G2-12-005-018  [P2] GAP  facet F05  effort S
- Legacy: Exact empty request message about extensions, correction, off-campus offer `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:212-214`
- vNext now: Empty copy `No other placement requests recorded yet.` `src/components/placements/learner-general-requests.tsx:91-94`
- Fix: Restore exact empty message

## G2-12-005-019  [P2] GAP  facet F05  effort S
- Legacy: Relative `Sent <moment.fromNow()>` timestamps `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:223-225`
- vNext now: No request timestamp on general list `src/components/placements/learner-general-requests.tsx:91-97`
- Fix: Add relative sent date and backend timestamp field

## G2-12-005-024  [P2] GAP  facet F06  effort S
- Legacy: New request modal select What do you need?; Offer Extension only if released offer `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:243-248`
- vNext now: Inline kind selector with no OFFER_EXTENSION (specialized widget separate) `src/components/placements/learner-general-requests.tsx:57-88`
- Fix: Restore conditional request picker and modal workflow

## G2-12-005-025  [P2] GAP  facet F06  effort S
- Legacy: Registration change `Change to` only 3 radio choices `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:249-250`
- vNext now: New choice offers 5 outcomes including entrepreneurship/exams `src/components/placements/learner-general-requests.tsx:64-68`
- Fix: Limit learner-change options to legacy allowed three if policy unchanged

## G2-12-005-026  [P2] GAP  facet F06  effort S
- Legacy: Company required max200 placeholder `e.g. Acme Corp` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:253-255`
- vNext now: Company plain input max150 without placeholder `src/components/placements/learner-general-requests.tsx:70-73`
- Fix: Match max length, required message, placeholder

## G2-12-005-027  [P2] GAP  facet F06  effort S
- Legacy: CTC (LPA) optional number min0 step0.1 placeholder `e.g. 8.5` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:256-257`
- vNext now: Annual CTC plain text and server strictly positive numeric string, no numeric step control `src/components/placements/learner-general-requests.tsx:74-77`
- Fix: Match numeric UI and optionality after business approval

## G2-12-005-029  [P2] GAP  facet F06  effort S
- Legacy: Reason label `Tell the placement cell why`, required min3, 3 rows `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:268-269`
- vNext now: `Why are you requesting this?` 3-row textarea max2000; generic error `src/components/placements/learner-general-requests.tsx:85-87`
- Fix: Restore exact label and field error

## G2-12-005-038  [P2] GAP  facet F09  effort S
- Legacy: Modal titled New request with Send/Cancel, dismiss lock while upload, destroyOnClose `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:239-270`
- vNext now: Always expanded inline form; no dialog or explicit cancel `src/components/placements/learner-general-requests.tsx:57-99`
- Fix: Restore modal lifecycle and actions

## G2-12-005-044  [P2] GAP  facet F10  effort S
- Legacy: Dispute absence notice uses notice body in reason `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:116-116`
- vNext now: Absence prefill from URL IDs only, reason starts blank `src/components/placements/learner-general-requests.tsx:18-23,33-42`
- Fix: Prefill reason text containing notice context

## G2-12-005-049  [P2] GAP  facet F12  effort S
- Legacy: Request statuses PENDING, APPROVED, AUTO_APPROVED, REJECTED `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:21-21`
- vNext now: General request supports statuses incl pending, approved/rejected; raw labels `src/components/placements/learner-general-requests.tsx:91-97`
- Fix: Retain AUTO_APPROVED presentation and status vocabulary

## G2-12-005-055  [P2] GAP  facet F13  effort S
- Legacy: No requests empty explanatory call to action `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:212-214`
- vNext now: No other placement requests recorded yet `src/components/placements/learner-general-requests.tsx:91-94`
- Fix: Restore legacy helper text

## G2-12-005-060  [P2] GAP  facet F15  effort S
- Legacy: Request decision reply visible in Your requests; no direct email client `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:207-231`
- vNext now: General request history decisionNote shown and in-app notifications can alert TPO `src/components/placements/learner-general-requests.tsx:91-97`
- Fix: Retain status labels and reply cues

## G2-12-005-064  [P2] GAP  facet F16  effort S
- Legacy: Mobile modal request form and dragger resize with AntD defaults `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:239-270`
- vNext now: Tall expanded request fields with full-width mobile Submit `src/components/placements/learner-general-requests.tsx:57-99`
- Fix: Use mobile sheet/modal with fields/padding consistent legacy

## G2-12-005-067  [P2] GAP  facet F17  effort S
- Legacy: Request modal keyboard dismiss locked while upload/pending `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:239-242`
- vNext now: No modal, no keyboard focus trap or dirty close guard `src/components/placements/learner-general-requests.tsx:57-99`
- Fix: Restore accessible request dialog with pending guard

## G2-12-005-070  [P2] GAP  facet F18  effort S
- Legacy: `Your requests` and `New request`, empty explanatory sentence `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:207-213`
- vNext now: `Other placement requests`, `Send request`, `Request history` `src/components/placements/learner-general-requests.tsx:57-60,91-97`
- Fix: Align exact titles and actions

## G2-12-005-071  [P2] GAP  facet F18  effort S
- Legacy: `Company`, `CTC (LPA)`, `Offer letter`, `Tell the placement cell why` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:253-268`
- vNext now: `Company name`, `Annual CTC in LPA`, `Proof link (HTTPS)`, `Why are you requesting this?` `src/components/placements/learner-general-requests.tsx:70-87`
- Fix: Restore legacy label strings where semantically compatible

## G2-12-005-078  [P2] MISSING  facet F20  effort S
- Legacy: Upload in progress blocks modal dismiss; upload status resets after request `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:92-106`
- vNext now: No upload or request dirty state `src/components/placements/learner-general-requests.tsx:43-55`
- Fix: Implement upload and prevent loss of in-flight attachments
