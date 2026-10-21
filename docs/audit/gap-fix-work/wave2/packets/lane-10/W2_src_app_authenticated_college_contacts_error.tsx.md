# Work packet (wave 2): edit src/app/(authenticated)/college/contacts/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/college-admin-people.md

## G2-8-001-039  [P3] GAP  facet F15  effort S
- Legacy: `hooks/useContacts.js:31-37`: client-only error notification, not an email
- vNext now: `app/(authenticated)/college/contacts/error.tsx:7-10`: inline error, no email action
- Fix: Restore comparable info notification; verify no backend mail triggered by GET
