# Work packet (wave 2): edit src/app/api/projects/templates/[templateId]/rollback/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-2-021-011  [P2] GAP  facet F03  effort M
- Legacy: AdminProjectTemplateController.java:470-483 rollback command with expectedTemplateVersion query
- vNext now: src/app/api/projects/templates/[templateId]/rollback/route.ts:7-15 POST body expected version and confirmed
- Fix: Update rollback forms with required explicit confirmation and version.
