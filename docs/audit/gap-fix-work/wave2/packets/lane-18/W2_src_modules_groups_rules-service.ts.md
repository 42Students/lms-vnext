# Work packet (wave 2): edit src/modules/groups/rules-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/admin-group-controller.md

## G2-3-024-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:233-265`
- vNext now: `src/modules/groups/rules-service.ts:61-217`, `src/modules/groups/college-rule-preview-service.ts:29-140`
- Fix: Legacy rule put/delete/apply and eligibility preview, VNext upsert/refresh service exists but College detail UI mainly SAVE_RULE and standalone bounded preview. Wire confirmed apply and clear rule.

## G2-3-024-042  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:141-146`, `225-265`
- vNext now: `src/modules/groups/rules-service.ts:78-217`
- Fix: Legacy reconciliation and rule apply are explicit background-like operations; VNext refresh needs an accessible manual trigger or documented scheduler. Do not infer autoRefresh means currently scheduled.

## G2-3-024-048  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/AdminGroupController.java:259-265`
- vNext now: `src/components/groups/college-group-detail-writes.tsx:52-100`, `src/modules/groups/rules-service.ts:78-217`
- Fix: Legacy one-click explicit rule apply on group is not surfaced in cited VNext detail actions; complete after bounded preview and user confirmation.
