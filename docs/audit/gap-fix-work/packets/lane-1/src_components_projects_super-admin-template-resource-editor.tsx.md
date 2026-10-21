# Work packet: edit src/components/projects/super-admin-template-resource-editor.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md

## G2-12-029-047  [P1] MISSING  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/useUnsavedFormGuard.js:17-55 — unsaved guard beforeunload and routeChangeStart.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:18-21,45-99 — local rows no unsaved navigation guard.
- Fix: Add dirty-state guard for tabs/back/reload.

## G2-12-029-023  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:81-85 — backend unsafe URL message surfaced via showProjectError.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:31-43 — Zod/parser generic first issue or inline Could not save resources.
- Fix: Preserve precise unsafe URL server error.

## G2-12-029-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:259-275 — max500 and Item N: Title required.
- vNext now: src/modules/projects/validation.ts:126-129 and src/components/projects/super-admin-template-resource-editor.tsx:31-32 — max200 and first Zod issue only.
- Fix: Match cap/row-specific error or clarify intentional smaller cap.

## G2-12-029-027  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:78-80 — success message Resources saved toast, reset form, reload.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:40-42,97 — inline Banner Template resources saved., close editor.
- Fix: Restore success toast text/dismissal/reopen state.

## G2-12-029-028  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:104-106 — Links must be ordinary http(s) URLs help message.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:45-99 — no help text.
- Fix: Add source message above form.

## G2-12-029-026  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:82-85 — Failed to save resources fallback.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:42-43 — Could not save resources fallback.
- Fix: Use source exact fallback copy.
