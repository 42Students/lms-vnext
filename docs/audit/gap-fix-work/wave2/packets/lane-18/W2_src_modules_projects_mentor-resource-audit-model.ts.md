# Work packet (wave 2): edit src/modules/projects/mentor-resource-audit-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:7-12 four color-coded action tags
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:9-16 summaries only, not per-row colored status badges
- Fix: Render Saved blue, Added green, Edited gold, Removed red tags

## G2-15-017-009  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:39-41 resourceOrder captured
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:13-20 metadata only projectId/resourceId
- Fix: Write immutable sequence snapshot per mutation

## G2-15-017-011  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:18-24 resource slug display transforms prefix and hyphens
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:15-16 subjectLabel uses title directly
- Fix: Render legacy key-normalized label or em-dash fallback

## G2-15-017-027  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:7-12 legacy UPSERT CREATE UPDATE DELETE vocabulary
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:3-12 CREATED UPDATED ARCHIVED producers
- Fix: Define unambiguous source action mapping including UPSERT
