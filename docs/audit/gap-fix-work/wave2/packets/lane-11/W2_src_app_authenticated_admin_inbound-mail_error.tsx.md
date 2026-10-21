# Work packet (wave 2): edit src/app/(authenticated)/admin/inbound-mail/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-077  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-126` error shows warning banner and Retry, no empty table on error
- vNext now: `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7` full ErrorState, `src/app/(authenticated)/admin/inbound-mail/page.tsx:29-33` undeployed schema warning
- Fix: Retain contextual retry banner without misleading empty state

## G2-10-009-081  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:59-65` fetchWithErrorHandling catches list response failure
- vNext now: `src/modules/inbound-mail/admin-service.ts:65-68` repository exceptions bubble to `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7`
- Fix: Provide inline retry for scoped read error

## G2-10-009-099  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:121` Couldn't load inbound mail
- vNext now: `src/app/(authenticated)/admin/inbound-mail/error.tsx:5` Inbound mail unavailable
- Fix: Use exact load failure label
