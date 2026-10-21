# Work packet (wave 2): edit src/components/shell/legacy-mobile-footer.css

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/mobile-responsive-contract.md

## G2-3-033-057  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/MobileFooter/MobileFooter.jsx:30-62`
- vNext now: `src/components/shell/legacy-mobile-footer.css:53-77`
- Fix: At 320px, five footer items min44+padding and max64 must fit legacy; vNext six learner items may truncate labels.
