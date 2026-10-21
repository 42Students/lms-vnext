# Work packet (wave 2): edit src/modules/messaging/template-boundary-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/tpo-mail-service.md

## G2-18-010-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy event `OFFER_RELEASED` mapped `offer-released` via lowercase+underscore replacement (`TpoMailService.java:222-225`).
- vNext now: New templateKeys are arbitrary configured whitelist and require namespaced formatting (`messaging/providers.ts:39-46`; `messaging/template-boundary-model.ts:2-7`).
- Fix: Provide normalized event→configured template map for every old TPO event.
