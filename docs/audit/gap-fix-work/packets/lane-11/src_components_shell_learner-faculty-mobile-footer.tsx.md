# Work packet: edit src/components/shell/learner-faculty-mobile-footer.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:81-86`
- vNext now: `src/components/shell/learner-faculty-mobile-footer.tsx:70-77`
- Fix: Legacy unread count API failure may display 0; vNext retains null/no badge on count failure, compare empty/offline state.
