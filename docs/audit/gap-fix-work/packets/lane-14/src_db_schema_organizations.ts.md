# Work packet: edit src/db/schema/organizations.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-organizations.md

## G2-3-030-067  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/OrganizationController.java:68-97`
- vNext now: `src/db/schema/organizations.ts:5-19`
- Fix: Legacy numeric Organization model with isDeleted vs UUID, ACTIVE/ARCHIVED + timestamps; migration must map primary keys, historical soft deletes.
