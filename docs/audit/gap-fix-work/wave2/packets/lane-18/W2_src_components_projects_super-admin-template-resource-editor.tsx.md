# Work packet (wave 2): edit src/components/projects/super-admin-template-resource-editor.tsx

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md

## G2-12-029-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:97-122 — error, 8-row Skeleton, one admin-form-card and form directly visible.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:45-99 — Edit resources collapsed toggle then fieldsets, inline feedback.
- Fix: Restore inline editor on arrival and card containment.

## G2-12-029-004  [P2] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:103-106 — resource URL safety paragraph directly above editor.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:45-51 — no http(s)/javascript/data warning.
- Fix: Restore URL safety guidance.

## G2-12-029-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:109-119 — Add resource dashed button, Save resources primary.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:89-94 — Add resource secondary, Save as new version primary.
- Fix: Match button texts/prominence.

## G2-12-029-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-139 — rows title expandable, icon Move up/down/Remove, Undo remove.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:52-88 — always-expanded Resource N, text Move up/down/Remove, no Undo.
- Fix: Recreate source row collapse controls/undo affordance.

## G2-12-029-007  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-103 — search list over 12 items and Showing N of M text.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:51-95 — no list search or count.
- Fix: Add over-12 filter and count.

## G2-12-029-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144-166 — resource fields Key, Type, Title, URL, Access notes, Description, Pinned, Required.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:54-79 — same concepts plus Status, order Key,Title,Type,Status,URL,Description,Access notes,Required,Pinned.
- Fix: Reorder and label fields to source.

## G2-12-029-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144-145 — optional key slug from title preview.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:54-55 — non-required key field but no preview.
- Fix: Restore slug preview and generated title key.

## G2-12-029-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:49-51,97-103 — list search if >12 rows by title or content.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:51-95 — no search, renders all resources.
- Fix: Support large template resource list search.

## G2-12-029-015  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:70-85 — removing row offers Undo before Save.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:85-86 — immediately filter row out, no undo.
- Fix: Add deletion undo.

## G2-12-029-016  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:145 — Key optional, auto-generated from title, half-width.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:54-55 — maxLength64, auto-generation missing.
- Fix: Implement source key auto-fill.

## G2-12-029-017  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:160 — Title required placeholder e.g. Project brief.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:56-57 — title input max200 but no required marker/placeholder.
- Fix: Match title validation/placeholder.

## G2-12-029-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:162 — Access notes optional text single-line with e.g. Requires college email to view.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:72-75 — multi-line textarea max2000.
- Fix: Restore single-line input or document expansion.

## G2-12-029-029  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-118 — row header collapse toggled independently.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:52-88 — fixed fieldset always visible within global Edit resources.
- Fix: Implement per-row collapse.

## G2-12-029-031  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:399-400,421-422 and docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:69-80 — GET then PUT template with scalars/resources only.
- vNext now: src/app/api/projects/templates/[templateId]/route.ts:16-41 and src/components/projects/super-admin-template-resource-editor.tsx:29-42 — PATCH whole blueprint with expectedVersion and changeNote.
- Fix: Preserve resource-only update semantics and CAS version tracking.

## G2-12-029-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:348-354 — slug materialization collision suffix on resource keys.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:23-28 — resource-N key based on first available integer.
- Fix: Align title slug and collision resolution.

## G2-12-029-038  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:97-99 — error Alert within shell above Card.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:96-97 and src/components/projects/super-admin-template-subview-page.tsx:125-132 — error Banner under editor and full ErrorState on fetch failure.
- Fix: Match in-shell alert placement.

## G2-12-029-042  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:168-171 — xs24/md12 half fields with 12px gutters.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:51-53 — md two-column fieldsets with larger vertical gaps.
- Fix: Match responsive two-column placements.

## G2-12-029-043  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:115-138 — aria-expanded, explicit Move ITEM up/down and Remove ITEM aria-labels.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:80-87 — plain Move up/down, Remove buttons with no resource title in name.
- Fix: Restore item-specific accessible labels.

## G2-12-029-044  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:95,105,112-119 — Reading material and links copied...; Add resource; Save resources.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:47-49,90-94 — Edit resources, Save as new version; subtitle in surrounding page.
- Fix: Match literal source copy and labels.

## G2-12-029-046  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:97-103 — 12+ items expose search; hidden rows not instantiated.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:51-88 — all rows rendered up to200 without list search.
- Fix: Add collapse/filter at scale.

## G2-12-029-053  [P2] MISSING  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:104-108 — Undo remove link in repeating editor.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:85-86 — no undo.
- Fix: Restore unsaved deletion undo.

## G2-12-029-010  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:151-158 — Type options Link, PDF, Document, Slides, Video, File with title casing.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:58-61 — upper-case LINK/PDF/DOCUMENT/SLIDES/VIDEO/FILE.
- Fix: Use source option labels mapped to enum.

## G2-12-029-011  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:161-163 — URL for a Link, Access notes optional and exact placeholder.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:66-75 — URL and Access notes generic labels, https:// only.
- Fix: Restore descriptive labels/placeholders.

## G2-12-029-018  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:151-158 — Type select with capitalized labels.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:58-61 — type selection displays raw enum.
- Fix: Use source labels.

## G2-12-029-019  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:161 — URL (for a Link) with https://..., optional.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:66-68 — URL generic and https:// placeholder.
- Fix: Restore placeholder/semantics.

## G2-12-029-021  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:163 — Description textarea placeholder What this resource is for.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:69-71 — multiline no placeholder.
- Fix: Restore placeholder.

## G2-12-029-022  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:164-165 — Pinned then Required checkbox order.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:76-79 — Required then Pinned.
- Fix: Restore checkbox order.

## G2-12-029-045  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144-166 — title case Type and Access notes (optional) / URL (for a Link).
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:58-75 — raw uppercase enums, generic URL/Access notes.
- Fix: Restore exact labels.
