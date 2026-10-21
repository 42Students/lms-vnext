# Work packet (wave 2): edit src/app/(authenticated)/hr/conversations/[threadId]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-036  [P2] GAP  facet F10  effort S
- Legacy: GET /colleges/{id}/messages/threads/{threadId} loads general history (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:63-64`)
- vNext now: New readRecruiterThreadMessages on server with paginated detail (`src/app/(authenticated)/hr/conversations/[threadId]/page.tsx:25-35`)
- Fix: Compare message ordering and read-receipt side effects.

## G2-13-004-065  [P2] GAP  facet F20  effort S
- Legacy: Old relative date formatting uses viewer locale, Moment timezone (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:215-217`)
- vNext now: New explicitly IST for detail, own relative formatter for inbox (`src/app/(authenticated)/hr/conversations/[threadId]/page.tsx:24-24`)
- Fix: Verify IST policy and relative formatting at midnight, DST and clock skew.
