# Work packet: edit src/app/(authenticated)/admin/inbound-mail/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md

## G2-10-009-045  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-122` load warning Couldn't load inbound mail with Retry
- vNext now: `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7` page error Inbound mail unavailable
- Fix: Restore exact warning title, Retry and retain selected view

## G2-10-009-049  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-122` exactly Couldn't load inbound mail / Retry warning
- vNext now: `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7` Inbound mail unavailable / Retry
- Fix: Restore legacy load warning copy and style
