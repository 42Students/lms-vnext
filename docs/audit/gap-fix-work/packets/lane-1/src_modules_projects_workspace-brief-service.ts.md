# Work packet: edit src/modules/projects/workspace-brief-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u028-superadmin-workspace-overview.md

## G2-18-028-030  [P1] GAP  facet F12  effort L
- Legacy: Old overviewFactsRef re-sends unedited opaque JSON keys; overview.js:41-56,80-97
- vNext now: New strict object and full authoredBrief replace; workspace-brief-model.ts:2-12;workspace-brief-service.ts:23-26
- Fix: Migrate or preserve opaque template fields, never erase silently

## G2-18-028-044  [P1] GAP  facet F22  effort L
- Legacy: Old flexible overview JSON and definitionOfDone key; overview.js:41-66
- vNext now: New projectInstances.authoredBrief strict typed model with completionConditions; workspace-brief-model.ts:2-16;workspace-brief-service.ts:23-26
- Fix: Specify one-to-one migration including opaque facts, defaults and clear values
