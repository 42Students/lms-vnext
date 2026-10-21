# Work packet: edit src/app/(authenticated)/hr/conversations/[threadId]/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-028  [P2] GAP  facet F07  effort M
- Legacy: Unexpected thread response shows Could not load this conversation (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:46-60`)
- vNext now: New read service error can show 404/No access or error boundary (`src/app/(authenticated)/hr/conversations/[threadId]/page.tsx:34-46`)
- Fix: Differentiate malformed history vs forbidden vs transient errors.
