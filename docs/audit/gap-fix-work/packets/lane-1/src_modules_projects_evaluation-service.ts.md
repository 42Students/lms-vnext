# Work packet: edit src/modules/projects/evaluation-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-17-031-056  [P1] GAP  facet F22  effort L
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 submissions/evaluations and history.
- vNext now: V/modules/projects/submission-service.ts:21-54 review/submission/events and evaluation-service.ts:11-35 separate tables.
- Fix: Map every historical decision, approver, version, review and file evidence.
