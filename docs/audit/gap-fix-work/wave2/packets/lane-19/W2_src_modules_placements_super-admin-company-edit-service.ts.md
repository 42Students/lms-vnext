# Work packet (wave 2): edit src/modules/placements/super-admin-company-edit-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u024-super-admin-company-controller.md

## G2-16-024-017  [P2] GAP  facet F06  effort M
- Legacy: CompanyCurationService.java:79-85 Details accepts name/logoUrl/website/industry/description nullable.
- vNext now: super-admin-company-edit-service.ts:17-35 updates name,website,industry,about,logo with expectedUpdatedAt.
- Fix: Translate description→about and legacy logoUrl to public URL, preserve PATCH-like omitted fields.

## G2-16-024-043  [P2] GAP  facet F14  effort M
- Legacy: CompanyCurationService.java:79-85 logo URL editable text.
- vNext now: super-admin-company-edit-service.ts:29-35 logoPublicUrl field; storage/upload separate.
- Fix: Retain preview and HTTPS validation in company image editor.
