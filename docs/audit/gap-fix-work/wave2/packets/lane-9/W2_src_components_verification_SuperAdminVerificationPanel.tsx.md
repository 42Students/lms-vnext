# Work packet (wave 2): edit src/components/verification/SuperAdminVerificationPanel.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md

## G2-10-024-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:401-433 — Queue Card with Segmented tabs, needs-attention buttons, DataTable.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:72-130 — Filters outside list, separate VerificationWorkspace list and bulk Disclosure.
- Fix: Place tabs/work cues inside one Card and preserve order

## G2-10-024-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:461-471 — ActionsWindow and bulk dialog plus Send back Modal.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:87-125 — Inline bulk Disclosure and send-back controls inside Drawer.
- Fix: Restore ActionsWindow dialog and dedicated send-back modal

## G2-10-024-044  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:253-274 — Blind bulk verify Modal warns skipped missing proof.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:109-123 — Bulk inline confirmation and skipped note.
- Fix: Match modal safeguards and source help text

## G2-10-024-045  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:461-463 — ActionsWindow offers Review/Verify without opening/Send back.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:87-125 — Disclosure panel for selected only; actions not window.
- Fix: Restore action window and audience semantics

## G2-10-024-049  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/VerificationService.js:21-21 — POST /verify-many items per learner/section.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:53-59; src/app/api/admin/verification/bulk-review/route.ts:9-16 — POST bulk-review, result summary/failed.
- Fix: Map partial reasons and document per-item receipts

## G2-10-024-063  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:435-444 — Review sequence advances one learner at a time, skips second section as needed.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:39-43,73-80 — Sequence over max20 requests, may include both sections for same learner.
- Fix: Deduplicate learner sequence or match original per-section flow

## G2-10-024-069  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:423-426 — TpoDataTable exports CSV named verification-<tab>.
- vNext now: src/components/verification/SuperAdminVerificationPanel.tsx:126-129; src/components/verification/VerificationExportControl.tsx:4-27 — Export CSV named super-admin-profile-verification.csv.
- Fix: Use view-specific filename and column parity
