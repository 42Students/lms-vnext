# Work packet: edit src/components/projects/super-admin-template-plan-editor.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-014  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:97-104 — sprint may be empty (backlog) with saved-sprint options.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:225-230 and src/modules/projects/validation.ts:49-67 — sprintKey required.
- Fix: Support null/omitted sprint in schema and UI to restore backlog.

## G2-10-029-020  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-91 — key optional text with slug preview.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:221-224 — required key, max64 and no auto-generated path.
- Fix: Make key optional with stable generated slug/key uniqueness.

## G2-10-029-022  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:99-104 — optional Sprint select with backlog placeholder.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:225-231 — required Sprint, no backlog choice.
- Fix: Include backlog none/clear state.

## G2-10-029-024  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:117-125 — Type STORY/BUG/CHORE/SPIKE.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:251-260 — no Type editor; strict schema src/modules/projects/validation.ts:49-67 excludes taskType.
- Fix: Add persisted type field and select.

## G2-10-029-036  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:79-88 and docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:323-346 — only tasks replaced; generated key and orphan sprint cleared.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:90-116 — normalize all blueprint plan arrays; PATCH full blueprint + changeNote.
- Fix: Avoid incidental changes to other blueprint sections; retain backlog/key support.

## G2-10-029-038  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:35-38,79-85 — tasks can exist without saved sprints (backlog); deleted sprint unlink on save.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:69-83 — Add task no-op when no sprint; required sprint key.
- Fix: Implement nullable sprint/backlog and orphan relinking.

## G2-10-029-049  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-103 — search appears above 12 rows for manageable edit.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:217-275 — renders up to 2000 fieldsets in open editor.
- Fix: Use virtualized/collapsible/search editor to keep 500+ task performance stable.

## G2-10-029-051  [P1] MISSING  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/useUnsavedFormGuard.js:17-55 — unsaved changes guard on reload and client route/tab changes.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:33-42,124-142 — client draft state, no route leave prompt in editor.
- Fix: Reinstate unsaved-change guard for tab/back/reload.

## G2-10-029-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:229-237,262-275 — inline '<label> is required' and Item N: Title required validation.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:93-98 and src/modules/projects/validation.ts:12-67 — Zod first issue only in generic Banner.
- Fix: Show per-row exact field validation and original error copy.

## G2-10-029-028  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:259-268 — max 500 rows with precise Remove N before saving error.
- vNext now: src/modules/projects/validation.ts:123-126 and src/components/projects/super-admin-template-plan-editor.tsx:272-275 — schema max2000; Add disabled at 2000.
- Fix: Confirm desired cap and show equivalent error guidance.

## G2-10-029-030  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:89-91 — save error fallback Failed to save tasks via project error modal.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:116-120 — inline error from thrown message or fallback.
- Fix: Preserve exact fallback and error display location.

## G2-10-029-031  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:85-88 — success toast Tasks saved then reset and reload.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:111-115,141 — Tasks saved inline Banner and router.refresh.
- Fix: Use success toast with source wording and subsequent refresh.

## G2-10-029-032  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:110-126 — no sprint and orphan warnings always visible in Card.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:211-216 — only shown when editor expanded; orphan warning absent.
- Fix: Display both informational messages persistently.
