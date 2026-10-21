# Work packet: edit src/components/verification/TpoVerificationPanel.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u025-tpo-verification.md

## G2-11-025-044  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy Act on selected → Send a message via bulkNudge to selected students; verify TPO page includes equivalent student outreach without hidden access.

## G2-11-025-063  [P1] MISSING  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy bulkNudge sends in-app student outreach from TPO verification action menu; confirm new send-message action rather than replace with verification event.

## G2-11-025-085  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy Send a message bulk action is a separate user-facing verification action; not proven present in new TPO verification panel.

## G2-11-025-034  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:269-270`
- vNext now: `src/components/verification/TpoVerificationPanel.tsx:74-78`
- Fix: Legacy bulk success `N verified. The students have been told.` and partial `N verified. M could not be: reason`; ensure new bulk carries counts/first failure.
