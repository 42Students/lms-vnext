# Work packet (wave 2): edit src/app/(authenticated)/recruiter/messages/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-001  [P2] GAP  facet F01  effort S
- Legacy: Recruiter Messages route opens one college-scoped inbox (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:18-28`)
- vNext now: Alias /recruiter/messages resolves to /hr/conversations (`src/app/(authenticated)/recruiter/messages/page.tsx:1-1`)
- Fix: Keep route parity and old menu highlight.
