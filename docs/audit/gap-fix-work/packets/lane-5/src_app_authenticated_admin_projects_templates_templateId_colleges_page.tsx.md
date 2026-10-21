# Work packet: edit src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-002  [P1] GAP  facet F01  effort L
- Legacy: colleges.js:24-27 templateId can be numeric or slug
- vNext now: admin/projects/templates/[templateId]/colleges/page.tsx:27-29 UUID only
- Fix: Resolve legacy numeric ID/slug to new UUID via authorised lookup
