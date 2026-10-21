# Work packet: NEW / MISSING items from docs/audit/gap2/lane-1/recruiter-invite-token.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-invite-token.md

## G2-1-034-057  [P1] GAP  facet F23  effort L
- Legacy: src/modules/placements/public-recruiter-invite-accept-service.ts:26: direct JOINED path rather than PENDING_HR.
- vNext now: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:102: explicitly pending state.
- Fix: Restore deliberate consent and existing-recruiter flow.
