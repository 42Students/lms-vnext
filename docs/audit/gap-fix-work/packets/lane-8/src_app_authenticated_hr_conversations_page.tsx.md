# Work packet: edit src/app/(authenticated)/hr/conversations/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-messages.md

## G2-13-004-005  [P1] GAP  facet F02  effort M
- Legacy: Header subtitle displays all unread across all threads (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:162-165`)
- vNext now: Subtitle counts unread only in visible paginated page, not total portfolio (`src/app/(authenticated)/hr/conversations/page.tsx:77-80`)
- Fix: Compute header summary from all authorized threads; label current-page figures separately.

## G2-13-004-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy generic fetch failure shows Could not load your messages with Retry (`docs/legacy-source/frontend/src/pages/recruiter/messages.js:38-43`)
- vNext now: Server list failure routed through page boundary, invalid filter shows Reset (`src/app/(authenticated)/hr/conversations/page.tsx:39-48`)
- Fix: Preserve recoverable backend Retry distinct from invalid-filter Reset.
