# Work packet (wave 2): edit src/components/hr/recruiter-conversation-live-refresh.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-062  [P2] GAP  facet F19  effort S
- Legacy: Old current General reload only when changed pulse, keeps draft (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:62-71`)
- vNext now: New polls but guards focused input and details[open] (`src/components/hr/recruiter-conversation-live-refresh.tsx:11-18`)
- Fix: Confirm fresh messages appear while typing without discarding draft; provide manual refresh.

## G2-13-004-066  [P2] GAP  facet F21  effort S
- Legacy: Old uses Axios APIs + live version-pulse hook (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:11-16`)
- vNext now: New server DB + router.refresh 4s (`src/components/hr/recruiter-conversation-live-refresh.tsx:6-23`)
- Fix: Document transport change and ensure versioned event refresh contract or equivalent.
