# Work packet (wave 3): edit src/components/tpo/recruiter-invite-landing.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-invite-token.md

## G2-1-034-024  [P1] MISSING  facet F08  effort L
- Legacy: docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:149-151: pending 'One more step' and login instruction for existing user.
- vNext now: src/components/tpo/recruiter-invite-landing.tsx:24,161-175: no pending stage.
- Fix: Provide pending-review success state and next steps.
