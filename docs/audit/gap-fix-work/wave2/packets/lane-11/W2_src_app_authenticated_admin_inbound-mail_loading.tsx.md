# Work packet (wave 2): edit src/app/(authenticated)/admin/inbound-mail/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-076  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:59-66` no dedicated list loading state; Table loading={!data}
- vNext now: `src/app/(authenticated)/admin/inbound-mail/loading.tsx:1` route Loading inbound mail… role status; `src/app/(authenticated)/admin/inbound-mail/page.tsx:48-88` no client refresh spinner
- Fix: Match table spinner and retain view while pending
