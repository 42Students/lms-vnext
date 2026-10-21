# Work packet (wave 2): edit src/app/api/projects/templates/[templateId]/assignments/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-2-021-013  [P2] GAP  facet F04  effort M
- Legacy: AdminProjectTemplateController.java:145-171 assignment GET List<Integer> and PUT map result
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:51-54 single `{assignment}` 201
- Fix: Return assigned-college list and before/after diff to bulk editor.

## G2-2-021-055  [P2] GAP  facet F17  effort M
- Legacy: AdminProjectTemplateController.java:145-168 bulk college assignment can affect many colleges
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:17-26 one college action
- Fix: If bulk restored, add keyboard-editable selected-college table and live count.

## G2-2-021-065  [P2] GAP  facet F21  effort M
- Legacy: AdminProjectTemplateController.java:326-371 assignment per-college endpoints and GET list
- vNext now: src/app/api/projects/templates/[templateId]/assignments/route.ts:29-87 POST/DELETE one college
- Fix: Add GET assigned colleges and bulk desired-set mutation to complete integrations.
