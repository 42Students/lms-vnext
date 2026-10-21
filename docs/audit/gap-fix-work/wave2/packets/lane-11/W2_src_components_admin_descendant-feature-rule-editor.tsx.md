# Work packet (wave 2): edit src/components/admin/descendant-feature-rule-editor.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-6/l19-u026-module-access-controller.md

## G2-10-019-025  [P2] MISSING  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:628-635 — Expand all/Collapse all buttons with disable conditions.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-250; src/components/admin/descendant-feature-rule-editor.tsx:43-68 — No expansion controls in rule editor.
- Fix: Add Expand/Collapse including `disabled` when all selected.

## G2-10-019-060  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:527-538 — Lock icon only when isSuperAdmin true.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:72-84; src/components/admin/descendant-feature-rule-editor.tsx:64-66 — Lock checkboxes available in their admin surfaces.
- Fix: Confirm server permits only Super Admin locking, hide otherwise.

## G2-10-019-097  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:352-395,435-457 — mutationRef locks reentrant writes and scope check post-await.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:30-41 — `busy` boolean and CAS expected snapshot guard.
- Fix: Prevent double submissions and late-scope confirmations.

## G2-19-026-050  [P2] GAP  facet F17  effort M
- Legacy: Legacy lock readonly/disabled at lower scope is shown as effectiveLocked. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:472`
- vNext now: vNext module editor has checkbox Lock even for descendant and current state. `src/components/admin/descendant-feature-rule-editor.tsx:64`
- Fix: Disable Lock control when ancestor locked; show precise winning scope.

## G2-19-026-051  [P2] GAP  facet F18  effort S
- Legacy: Legacy setValue response label 'Module access updated' and inherited null semantics. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:91`
- vNext now: vNext editor has 'Save rule', 'Recheck', and choice INHERIT. `src/components/admin/descendant-feature-rule-editor.tsx:59`
- Fix: Clone legacy label vocabulary and explanatory helper under tri-state.

## G2-10-019-035  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:616-637 — Refresh reloads scope tree/override lists in place, keeping route.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:104-109; src/components/admin/descendant-feature-rule-editor.tsx:59-65 — Individual Recheck scope, not full hierarchy refresh.
- Fix: Restore visible page Refresh.

## G2-10-019-081  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:549-553 — Clickable status chips role button, tabIndex0 and Enter key.
- vNext now: src/components/admin/descendant-feature-rule-editor.tsx:43-65 — Select/button form semantically accessible but not in-cell keyboard activation.
- Fix: Use keyboard-operable in-cell editor with focus restore.
