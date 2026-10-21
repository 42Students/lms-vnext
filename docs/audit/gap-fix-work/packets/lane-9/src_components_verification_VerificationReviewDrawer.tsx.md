# Work packet: edit src/components/verification/VerificationReviewDrawer.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-10-024-018  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:93-95 — Identity shows masked Aadhaar/PAN and 'Not given' placeholder.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:85-94 — Snapshot comparison lists submitted vs verified; field names/value structure differ.
- Fix: Show masked last four and 'Not given' placeholders without exposing full ID

## G2-11-025-047  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:52-66`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Sensitive document URL workflow: legacy getDocumentUrl(learnerId) only authorized by verification service; vNext document grants must scope exact learner membership and prevent raw object key leaks.

## G2-10-024-034  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:203-207 — Detail load error 'Could not open this student'.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:40-45 — Custom review error, TPO-only exact fallback.
- Fix: Use legacy error copy for Super Admin detail

## G2-11-025-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:198-207`
- vNext now: `src/components/verification/VerificationReviewDrawer.tsx:1-80`
- Fix: Legacy Could not open this student toast and close Drawer, vNext review drawer service error copy/focus should align.

## G2-10-024-035  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:226-242 — Decision failures 'Could not verify', 'Could not send it back'.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:65-70 — Adds 'Please try again.', 409 stale data note.
- Fix: Keep primary error exact, preserve CAS conflict guidance

## G2-10-024-036  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:326-327 — Reason required 'Say what needs to change'.
- vNext now: src/components/verification/VerificationReviewDrawer.tsx:53-55 — 'Write what needs to change before sending this back.'
- Fix: Restore exact client validation copy
