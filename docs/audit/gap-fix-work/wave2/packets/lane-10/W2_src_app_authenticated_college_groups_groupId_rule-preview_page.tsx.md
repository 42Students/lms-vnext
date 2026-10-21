# Work packet (wave 2): edit src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:233-236`
- vNext now: `src/modules/groups/college-rule-preview-service.ts:29-70`, `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx:23-37`
- Fix: Legacy GET rule returns 204 when absent; VNext standalone preview shows error page Rule preview unavailable and group detail displays None. Provide consistent explicit no-rule state.

## G2-3-024-035  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:233-265`
- vNext now: `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx:39-88`
- Fix: Ensure keyboard focus and screen reader distinction Preview only vs Apply rule; VNext standalone preview explicitly avoids any mutation.
