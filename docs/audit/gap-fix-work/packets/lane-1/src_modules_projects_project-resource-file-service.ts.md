# Work packet: edit src/modules/projects/project-resource-file-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-17-031-018  [P1] GAP  facet F06  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:302-340 resource array update and protected download.
- vNext now: V/modules/projects/resource-service.ts:63-89 controls status/visibility; project-resource-file-service.ts handles files.
- Fix: Align URL, file type, upload size and visibility field rules in task/resource forms.

## G2-17-031-038  [P1] GAP  facet F14  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:310-340 authorized resource download.
- vNext now: V/modules/projects/resource-service.ts:63-89 status/visibility filter and project-resource-file-service.ts signed files.
- Fix: Check object signed URL expiry/size/mime/filename and tenant download access.
