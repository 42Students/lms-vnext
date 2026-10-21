# Work packet (wave 2): edit src/components/projects/super-admin-template-plan-editor.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md

## G2-10-029-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:109-143 — editor opens directly without Edit tasks toggle.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:124-142 — collapsed Task plan requiring Edit tasks click.
- Fix: Show editing controls on arrival or explicitly add equivalent one-click edit affordance.

## G2-10-029-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:110-127 — no-sprints Alert with Add sprints first and backlog explanation.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:211-216 — simple paragraph only while expanded, omits backlog clause.
- Fix: Restore informational Alert and link/backlog copy.

## G2-10-029-007  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:125-127 — paragraph says orphaned task moves to backlog on Save.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:211-216 — no orphan/backlog guidance.
- Fix: Restore warning/behavior explanation or document discontinued backlog.

## G2-10-029-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:130-141 — Add task dashed full-width and Save tasks primary.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:272-284 — Add task secondary small, Reset changes and Save tasks controls.
- Fix: Match Add task prominence and primary save button.

## G2-10-029-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-139 — collapsed row header title + Expand/Collapse, Up/Down icon buttons and Remove icon.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:217-270 — always-visible fieldsets, textual Move up/down/Remove.
- Fix: Recreate expand/collapse and icon control labels.

## G2-10-029-010  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-108 — only when >12 rows: search plus Showing N of M items; Undo remove status.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:217-275 — no section search, no undo.
- Fix: Implement >12 search and unsaved remove undo.

## G2-10-029-013  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:109-115 — estimate options Fibonacci 1,2,3,5,8,13.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:243-248 — integer 1 through 13 via number control.
- Fix: Restore Fibonacci options for estimates.

## G2-10-029-015  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:143-153,229-237 — generated key preview appears when blank.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:221-224 — key required, no preview.
- Fix: Auto-materialize key with preview when left empty.

## G2-10-029-016  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:109-118 — zero rows No tasks yet; list title derived from title.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:315-338 — No tasks configured read-only empty state; editor says No tasks yet at src/components/projects/super-admin-template-plan-editor.tsx:275.
- Fix: Match source empty state and editor emphasis.

## G2-10-029-019  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:70-85 — deletion has Undo remove.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:266-270 — immediate local removal, no Undo option.
- Fix: Enable undo before save.

## G2-10-029-023  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:109-115 — Estimate optional select limited to Fibonacci.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:243-249 — optional number field permits 4,6,7,9 etc.
- Fix: Constrain to legacy scale.

## G2-10-029-025  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:128 — Due optional text with e.g. Before sprint 1.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:251-260 — no Due field.
- Fix: Add dueLabel string with matching placeholder.

## G2-10-029-026  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:130-141 — Description, Done when (optional), Approach textareas and help placeholders.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:251-260 — Description and What does done look like? only.
- Fix: Restore Done when and Approach labels/placeholders and storage.

## G2-10-029-033  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-118 — each card expands/collapses independently.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:136-142,217-270 — a single editor Expand/Cancel and full fieldsets.
- Fix: Provide per-item expand and focus restoration.

## G2-10-029-040  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:92-96,109-115 — three priorities and Fibonacci estimates.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:236-249 — four priorities, continuous integer estimate 1..13.
- Fix: Make dropdown and validation choices match legacy.

## G2-10-029-045  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:168-170 — inputs xs24/md half width via Ant Grid.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:220-221 — responsive md two-column grid and stacked controls.
- Fix: Check phone widths, field ordering and touch targets.

## G2-10-029-046  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-138,168-230 — per-row aria-expanded, descriptive move/remove labels and input htmlFor.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:217-270 — fieldset/legend labels, text buttons, no per-item toggle.
- Fix: Restore equivalent accessible row controls.

## G2-10-029-048  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-142 — exact placeholders/labels e.g. Draft submission checklist, Done when, Approach.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:220-260 — no samples, What's done look like and some fields absent.
- Fix: Use legacy TASK_FIELDS copy field by field.

## G2-10-029-021  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:97 — Title required, sample Draft submission checklist.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:232-235 — Title required max200 but no matching placeholder.
- Fix: Restore placeholder and required field visual.

## G2-10-029-047  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:100-102,138-141 — legacy subtitle, Add task and Save tasks copy.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:128-139,272-284 — same subtitle/Save tasks but adds Task plan and Edit tasks.
- Fix: Align header/control copy and prominence.
